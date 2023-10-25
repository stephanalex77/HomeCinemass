const Cart = require("../models/cartModel");
const Category = require("../models/categoryModel");
const Products = require("../models/productModel");
const User = require("../models/userModel");
const Coupon = require("../models/couponModel")
const Order = require("../models/orderModel")
const Wallet = require("../models/walletModel")
const razorpay = require('razorpay');

const key_secret = process.env.RAZORPAY_SECRET_KEY;
const key_id = process.env.RAZORPAY_ID_KEY;
const instance = new razorpay({ key_id, key_secret })

const populateProductDetails = async (cart) => {
  const populatedProducts = await Promise.all(cart.products.map(async (product) => {
    const productDetails = await Products.findById(product.product);
    return { ...product.toObject(), productDetails };
  }));

  const populatedCart = cart.toObject();
  populatedCart.products = populatedProducts;

  return populatedCart;
};


const getOrderReview = async (req, res) => {
  const userId = req.session.user_id;

  const user = await User.findById({ _id: userId });

  try {
    const order = await Order.findOne({ user: userId }).populate('shippingAddress');
    const cart = await Cart.findOne({ user: userId }).populate('products.product');
    const currentDate = new Date();

    const coupons = await Coupon.find({
      isListed: true,
      expirationDate: { $gte: currentDate }
    });

    if (cart && cart.products) {
      // Calculate cartSubtotal based on your cart schema
      const cartSubtotal = cart.products.reduce((total, product) => {
        return total + product.product_total;
      }, 0);

      // Now, apply the coupon to calculate the discount amount
      const couponCode = req.query.couponCode;// Replace with the actual coupon code
      const coupon = await Coupon.findOne({ couponCode: couponCode });
      console.log('coupojln',coupon)

     const discountAmount = req.session.discountAmount;
     
      // Find the default address
      const defaultAddress = user.address.find(address => address.is_default);

      res.render('orderreview', { user, cart, coupons,coupon, cartSubtotal, defaultAddress, order, discountAmount });
    } else {
      res.send('else');
    }
  } catch (error) {
    console.log(error.message);
  }
};





const orderDetails = async (req, res) => {
  try {

    const userId = req.session.user_id;
    const user = await User.findById({ _id: userId });
    const order = Order.find()
    res.render('orderDetails', { order, user })
  } catch (error) {

  }
}

const getOrderThankyou = async (req, res) => {
  try {
    res.render('orderTankyou')
  } catch (error) {
    console.log(error.message);
  }
}

const makeOrder = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = await User.findById({ _id: userId });
    const orderid = await generateOrderID();
    const shippingAddress = user.address.find(address => address.is_default);
    const { payment_option, GrandTotal } = req.body;

    const cart = await Cart.findOne({ user: userId }).populate({ path: 'products.product' });

    let total_amount = 0;
    cart.products.forEach((product) => {
      total_amount += product.product.product_sales_price * product.quantity;
    });

    if (payment_option === 'cod') {
      const newOrder = new Order({
        user: userId,
        orderId: orderid,
        products: cart.products.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
        })),
        shippingAddress,
        paymentMethod: payment_option,
        total_amount:GrandTotal,
        
        createdAt: new Date(),
      });

      const savedOrder = await newOrder.save();

      // Clear the cart (you may need to update this part based on how you manage the cart)
      cart.products = [];
      await cart.save();

      res.json({ method: 'cod' });
    } else if (payment_option === 'online') {
      console.log("Online Payment");
      const newOrder = new Order({
        user: userId,
        products: cart.products.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
        })),
        // orderId:userId,
        shippingAddress,
        paymentMethod: payment_option,
        total_amount:GrandTotal,
        createdAt: new Date(), // Corrected field name
      });

      req.session.newOrder = newOrder;
      const savedOrder = req.session.newOrder

      // Generate a Razorpay order
      const generateOrder = await generateOrderRazorpay(savedOrder._id, total_amount);
      console.log(savedOrder._id,"----------------------------------------------")

      console.log(generateOrder.id,"========================");
      // const savedOrder = await newOrder.save();

      // Clear the cart (you may need to update this part based on how you manage the cart)
   
  

      // Store the generated order details in the session


      res.json({ generateOrder, method: 'online' });

    } else {
      res.status(400).json({ error: 'Invalid payment method' });
    }
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const generateOrderID = async () => {
  try {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000);
    return `${timestamp}-${random}`;
  } catch (error) {
    console.log(error.message);
    throw error; 
  }
}



const generateOrderRazorpay = (orderId, total) => {
  return new Promise((resolve, reject) => {
    const options = {
      amount: total * 100,
      currency: "INR",
      receipt: String(orderId)
    };
    instance.orders.create(options, function (err, order) {
      if (err) {
        console.log("failed");
        console.log(err);
        reject(err);
      } else {
        console.log("Order Generated RazorPAY: " + JSON.stringify(order));
        resolve(order);
      }
    });
  })

}

const verifyOrderPayment = (details) => {
  console.log("DETAILS : " + JSON.stringify(details));
  return new Promise((resolve, reject) => {
    const crypto = require('crypto');

    let hmac = crypto.createHmac('sha256', '1sTJTD9v3zVeSezmfPwF73bn');
    hmac.update(
      String(details['order']['generateOrder']['id']) + '|' +
      String(details['payment']['razorpay_payment_id'])
    );
    hmac = hmac.digest('hex');

    console.log('orderid', details['order']['generateOrder']['id']);
    console.log('paymentid', details['payment']['razorpay_payment_id']);
    console.log('signature', details['payment']['razorpay_signature']);

    if (hmac === details['payment']['razorpay_signature']) {
      console.log("Verify SUCCESS");
      resolve();
    } else {
      console.log("Verify FAILED");
      reject();
    }
  });
};



const verifyRazorpayPayment = async (req, res) => {
  console.log('funtion')
  const userId = req.session.user_id;
  const cart = await Cart.findOne({ user: userId }).populate('products.product');
  try {
    const { razorpayOrderId, razorpayPaymentId, secret } = req.body;
    console.log("Razorpay Order ID:", razorpayOrderId)
    verifyOrderPayment(req.body)
      .then(async () => {
        console.log("Payment SUCCESSFUL");
        const orders = req.session.newOrder
        const saveOrder = new Order(orders)
        console.log('orderee', saveOrder)
        await saveOrder.save()

        cart.products = [];
        await cart.save();
        res.json({ status: true });

      }).catch((err) => {
        console.log(err);
        res.json({ status: false, errMsg: 'Payment failed!' });
      });
  } catch (err) {
    console.log(err);
    res.json({ status: false, errMsg: 'Payment failed!' });
  }
}

const createOrder = async (req, res) => {
  try {
    const orderData = req.body;

    const newOrder = new Order(orderData);
    const savedOrder = await newOrder.save();

    res.json({ success: true, order: savedOrder });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

const showorder = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = await User.findById({ _id: userId });
    
    // Sort orders by createdAt field in descending order (most recent first)
    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 });
    
    
    console.log("my orders:::", orders[0].shippingAddress);
    res.render('orderDetails', { orders, user,shippingAddress:orders[0].shippingAddress[0] });
  } catch (error) {
    console.error('Error retrieving orders:', error);
    res.status(500).send('Internal Server Error');
  }
};




const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    console.log('Cancel Order Request - Order ID:', orderId);
    const order = await Order.findById(orderId);
    console.log("what is inside body???", req.body);
    console.log('order::::::::::::::::::::::', order);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.orderStatus === 'Cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled' });
    }
    if (order.orderStatus === 'Delivered') {
      return res.status(400).json({ message: 'Cannot cancel a delivered order' });
    }
    const currentDate = new Date();
    console.log("current Date:::", currentDate);
    const orderDate = order.createdAt;
    console.log("qqqqqqqqqqqqqqqqqqqq", orderDate);
    const daysDifference = Math.floor((currentDate - orderDate) / (1000 * 60 * 60 * 24));
    console.log('bbbbbbbbbbbbbbbbbbbb', daysDifference);
    if (daysDifference > 10) {
      return res.status(400).json({ message: 'Cannot cancel an order placed for more than 10 days' });
    }

    if (order.paymentMethod !== 'cod') {
      const canceledAmount = order.totalprice;
      const userId = order.user;
      const transactionType = 'credit';
      await updateWalletBalance(userId, canceledAmount, transactionType);
  }


    order.status = 'Cancelled';
    const orderssss = await order.save();

    console.log('Order Cancelled:', orderssss);
    // return res.json({ success: true });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' ,success: false});
  }
};


const returnOrder = async (req, res) => {
  try {
    console.log("sdfghjkl");
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    console.log("aaaaaaaaaaaaaaaaa", order);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'Delivered') {
      return res.status(400).json({ message: 'Cannot return an order that is not delivered' });
    }

    const currentDate = new Date();
    const orderDate = order.createdAt;
    const daysDifference = Math.floor((currentDate - orderDate) / (1000 * 60 * 60 * 24));

    if (daysDifference > 10) {
      return res.status(400).json({ message: 'Cannot return an order placed for more than 10 days' });
    }

    order.status = 'Returned';
    order.reasonResponse = selectedReason;
    await order.save();

    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const orderStatusAdminSide = async(req, res)=>{
  try {
    const orders = await Order.find().populate('user');
    res.render('orderList',{orders})
  } catch (error) {
    console.log(error.message);
  }
}



const walletDispaly = async(req, res)=>{
  try{
      
          const userId = req.session.user_id; 
  
          const wallet = await Wallet.findOne({ userId });
          console.log('walle::::',wallet)
          if (!wallet) {
              return res.render('wallet', { walletTransactions: [] });
          }
          res.render('walletHistory', { walletTransactions: wallet });
      } catch (error) {
          console.error(error.message);
          res.status(500).send('Internal Server Error');
      }
 
}
const updateWalletBalance = async (userId, amount)=> {
  try {
    console.log('hfs')
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = new Wallet({
        userId,
        balance: amount,
      });
    } else {
      wallet.balance += amount;
    }
    console.log('rbkjbc')
    await wallet.save();
    return { success: true, message: 'Wallet updated successfully' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Error updating wallet' };
  }
}
module.exports = {

  populateProductDetails,
  getOrderReview,
  orderDetails,
  getOrderThankyou,
  makeOrder,
  showorder,
  createOrder,
  verifyRazorpayPayment,
  cancelOrder,
  returnOrder,
  orderStatusAdminSide,
  
  walletDispaly

}