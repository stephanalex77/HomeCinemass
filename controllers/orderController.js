const Cart = require("../models/cartModel");
const Category = require("../models/categoryModel");
const Products = require("../models/productModel");
const User = require("../models/userModel");
const Coupon = require("../models/couponModel")
const Order = require("../models/orderModel")
const Wallet = require("../models/walletModel")
const fs = require("fs");
const { Readable } = require('stream');
const razorpay = require('razorpay');
const easyinvoice = require('easyinvoice');
const { OrderedBulkOperation } = require("mongodb");

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

      console.log("cart totallll:::",cartSubtotal );
      // Now, apply the coupon to calculate the discount amount
      const couponCode = req.query.couponCode;// Replace with the actual coupon code
      const coupon = await Coupon.findOne({ couponCode: couponCode });
      console.log('coupojln',coupon)

     const discountAmount = req.session.discountAmount|| 0;
     
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
    req.session.discountAmount = 0
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
      const tempvalue ="stephan"
      const newOrder = new Order({
        user: userId,
        products: cart.products.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
        })),
        orderId:tempvalue,
        shippingAddress,
        paymentMethod: payment_option,
        total_amount:GrandTotal,
        createdAt: new Date(), // Corrected field name
      });

      req.session.newOrder = newOrder;
      const savedOrder = req.session.newOrder

      // Generate a Razorpay order
      const generateOrder = await generateOrderRazorpay(savedOrder._id, GrandTotal);
      // console.log(savedOrder.orderId,"----------------------------------------------")

      console.log(generateOrder.id,"========================");
      req.session.tempOrder = generateOrder.id
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
    // console.log("Razorpay Order ID:", razorpayOrderId)
    
    verifyOrderPayment(req.body)
      .then(async () => {
        console.log("Payment SUCCESSFUL");
        const orders = req.session.newOrder
        const orderId =req.session.tempOrder
        orders.orderId = orderId
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
    const orders = await Order.find({ user: userId }).populate('products.product')
      .sort({ createdAt: -1 });

       console.log("orders:",orders);
      const itemsPerPage = 2;
       const currentpage = parseInt(req.query.page) || 1;
       const startIndex = (currentpage - 1) * itemsPerPage;
       const endIndex = startIndex + itemsPerPage;
       const totalpages = Math.ceil(orders.length / itemsPerPage);
       const pages = Array.from({ length: totalpages }, (_, i) => i + 1); // Create an array of page numbers
       const currentorders = orders.slice(startIndex, endIndex);
       
      //  console.log(orders,"ods");
  

    // console.log("my orders:::", orders[0].shippingAddress);
    res.render('orderDetails', {  user,shippingAddress:orders[0].shippingAddress[0], orders:currentorders,pages,currentpage, totalpages });
  } catch (error) {
    console.error('Error retrieving orders:', error);
    res.status(500).send('Internal Server Error');
  }
};




const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
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
    const orderDate = order.createdAt;
    const daysDifference = Math.floor((currentDate - orderDate) / (1000 * 60 * 60 * 24));

    if (daysDifference > 10) {
      return res.status(400).json({ message: 'Cannot cancel an order placed for more than 10 days' });
    }

    if (order.paymentMethod !== 'cod') {
      const canceledAmount = order.total_amount;
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
    const { orderId } = req.body;
    const order = await Order.findById(orderId);

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
    const orders = await Order.find().populate('user').sort({ createdAt: -1 });
    const itemsPerPage = 6;
     const currentpage = parseInt(req.query.page) || 1;
     const startIndex = (currentpage - 1) * itemsPerPage;
     const endIndex = startIndex + itemsPerPage;
     const totalpages = Math.ceil(orders.length / itemsPerPage);
     const pages = Array.from({ length: totalpages }, (_, i) => i + 1); // Create an array of page numbers
     const currentorders = orders.slice(startIndex, endIndex);
     
    //  console.log(orders,"ods");

    res.render("orderList", {orders, orders:currentorders,pages,currentpage, totalpages });
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
              return res.render('wallet', { transactions: [] });
          }
          res.render('walletHistory', { transactions: wallet });
      } catch (error) {
          console.error(error.message);
          res.status(500).send('Internal Server Error');
      }
 
}
const updateWalletBalance = async (userId, amount, transactionType) => {
  try {
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      // Create a new wallet with the initial transaction
      const newWallet = new Wallet({
        userId,
        balance: amount,
        transactions: [
          {
            type: transactionType,
            amount: amount,
          },
        ],
      });
      await newWallet.save();
    } else {
      // Update the wallet balance
      wallet.balance += amount;

      // Create a new transaction and push it to the transactions array
      const newTransaction = {
        type: transactionType,
        amount: amount,
      };
      wallet.transactions.push(newTransaction);

      await wallet.save();
    }

    return { success: true, message: 'Wallet updated successfully' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Error updating wallet' };
  }
};


const singleOrderDetails = async (req, res) => {
  try {
    const userId = req.params.userId;
    const orderId = req.params.orderId;

    // Find the user and order based on the user ID and order ID
    const user = await User.findById(userId);

    // Use the "populate" method to populate the "products.product" field
    const order = await Order.findOne({ user: userId, _id: orderId }).populate({
      path: 'products.product',
    }).populate('shippingAddress');;

    if (!user || !order) {
      return res.status(404).send('Order not found');
    }

    res.render('singleOrderDetails', { order, user, shippingAddress: order.shippingAddress });

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
}


// const adminOrderDetails = async (req, res) => {
//   try {
//     const userId = req.params.userId;
//     const orderId = req.params.orderId;

//     console.log('User ID:', userId);
//     console.log('Order ID:', orderId);

//     const user = await User.findById(userId);
//     const order = await Order.findOne({ user: userId, _id: orderId }).populate({
//       path: 'products.product',
//     }).populate('shippingAddress');

//     if (!user || !order) {
//       console.log('Order not found');
//       return res.status(404).send('Order not found');
//     }

//     res.render('singleOrderDetails', { order, user, shippingAddress: order.shippingAddress });

//   } catch (error) {
//     console.error(error.message);
//     res.status(500).send('Internal Server Error');
//   }
// }

const adminOrderDetails = async(req,res)=>{
  try {
    const userId = req.params.userId;

    const orderId = req.params.orderId
    console.log("my orderid:",orderId);
    const user = await User.findById(userId);

    const order = await Order.findById(orderId).populate("products.product").populate("user").populate('shippingAddress');
    // const order = await Order.findOne({ user: userId, _id: orderId }).populate({
    //         path: 'products.product',
    //       }).populate('shippingAddress');
    console.log("my orders:",order);
    res.render('adminOrderDetails',{order, user, shippingAddress: order.shippingAddress})
  } catch (error) {
    console.log(error.message);
    // res.redirect('/404')
  }
 }



 const getOrderInvoice = async (req, res) => {

  try {
    const id = req.query.orderId

    const userId = req.session.userId;
    
    result = await getOrderById(id);
   
    const date = result.orderDate.toLocaleDateString();
    const product = result.products;
    // console.log("produ:::::::1",product[0].product);
    // console.log("produ:::::::2",product[0].product.description);
    // console.log("produ:::::::3",product[0].product.product_sales_price);
    // console.log("produ:::::::4",product);

    const order = {
      id: id,
      total: parseInt(result.total_amount),
      date: date,
      payment: result.paymentMethod,
      // name: result.address.name,
      // shippingAddress: result.address.address,
      // tel: result.address.tel,
      // city: result.address.city,
      // state: result.address.state,
      // pincode: result.address.pincode,
      product: result.products,
    };
    // console.log('hello',result)
    // console.log('type',typeof result.products)
    // let products = []

    // for(let x in result.products){
    //   products.push(
    //     {
    //       "quantity": parseInt(result.products[x].quantity),
    //       // "description": result.products[x].product.description,
    //       "name":result.products[x].product.product_name,
    //       "tax-rate": 0,
    //       "price":result.products[x].product.product_sales_price,
    //     }
    //   )
    // }


    const products = result.products.map((product) => ({
      "quantity": parseInt(product.quantity),
      "description":product.product.product_name,
      "name":product.product.product_name,
      "tax-rate": 0,
      "price":product.product.product_sales_price,
    }));

    console.log('producsd',products)

    let data = {
      customize: {},
      images: {
        // logo: "https://public.easyinvoice.cloud/img/logo_en_original.png",

        background: "https://public.easyinvoice.cloud/img/watermark-draft.jpg",
      },


      sender: {
        company: "Halang",
        address: "Brototype",
        zip: "686633",
        city: "Maradu",
        country: "India",
      },

      client: {
        company: order.name,
        address: order.shippingAddress,
        zip: order.pincode,
        city: order.city,
        // state:" <%=order.state%>",
        country: "India",
      },
      information: {
        number: order._Id,

        date: order.orderDate,
        // Invoice due date
        "due-date": "Nil",
      },

      products: products,
      // The message you would like to display on the bottom of your invoice
      "bottom-notice": "Thank you,Keep shopping.",
    };
    result = Object.values(result)



    easyinvoice.createInvoice(data, async (result) => {
      //The response will contain a base64 encoded PDF file
      console.log(result, "jjj11", data, "pdf11");
      if (result && result.pdf) {
        await fs.writeFileSync("invoice.pdf", result.pdf, "base64");




        // Set the response headers for downloading the file
        res.setHeader('Content-Disposition', 'attachment; filename="invoice.pdf"');
        res.setHeader('Content-Type', 'application/pdf');

        // Create a readable stream from the PDF base64 string
        const pdfStream = new Readable();
        pdfStream.push(Buffer.from(result.pdf, 'base64'));
        
        pdfStream.push(null);

        // Pipe the stream to the response
        pdfStream.pipe(res);
      } else {
        // Handle the case where result.pdf is undefined or empty
        res.status(500).send("Error generating the invoice");
      }


    }).catch((err) => {
      console.log(err, "errrrrrr")
    })


  } catch (error) {
    // res.render('/error')
    console.log(error.message);
  }
}
async function getOrderById(orderId) {
  try {
    const order = await Order.findById(orderId)
      .populate({
        path: 'products.product',
        model: 'Products',
      });
    return order;
  } catch (error) {
    throw error;
  }
}


const updateStatus = async (req, res) => {
  try {

    const { orderId } = req.params;
    const { newStatus } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(400).json({ message: 'Order not found' });
    }

    if (order.status === 'Delivered') {
      return res.status(400).json({ message: 'Order is already delivered' });
    }
    if (order.status === 'Returned') {
      return res.status(400).json({ message: 'Order is already Returned' });
    }
    if (order.status === 'Cancelled') {
      return res.status(400).json({ message: 'Order is already canceled' });
    }
    order.status = newStatus;

    if (newStatus === 'Delivered') {
      order.delivered = {
        deliveredDate: new Date(),
      };
    }
 
    await order.save();

    res.status(200).json({ success: true });

  } catch (error) {
    // res.redirect('/admin/404')
    console.log(error.message);
 }
}

// ! ******************

async function calculateDeliveredOrderTotal() {
  try {
    const totalData = await Order.aggregate([
      {
        $match: {
          status: 'Delivered',
        },
      },
      {
        $group: {
          _id: null,
          totalPriceSum: { $sum: '$total_amount' },
          count: { $sum: 1 },
        },
      },
    ]);
    
    if (totalData.length === 0) {
      return {
        _id: null,
        totalPriceSum: 0,
        count: 0,
      };
    }

    return totalData;
  } catch (error) {
    throw error;
  }
}



async function calculateCategorySales() {
  try {
    const categorySalesData = await Order.aggregate([
      {
        $unwind: '$products',
      },
      {
        $lookup: {
          from: 'products',
          localField: 'products.product',
          foreignField: '_id',
          as: 'productDetails',
        },
      },
      {
        $unwind: '$productDetails',
      },
      {
        $match: {
          status: 'Delivered',
        },
      },
      {
        $lookup: {
          from: 'Categories',
          localField: 'productDetails.categoryname',
          foreignField: 'categoryname',
          as: 'categoryDetails',
        },
      },
      {
        $unwind: '$categoryDetails',
      },
      {
        $group: {
          _id: '$productDetails.categoryname',
          categoryName: { $first: '$categoryDetails.categoryname' },
          totalSales: {
            $sum: { $multiply: ['$productDetails.product_sales_price', '$products.quantity'] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          categoryName: 1,
          totalSales: 1,
        },
      },
    ]);

    return categorySalesData;
  } catch (error) {
    throw error;
  }
}


async function calculateDailySales() {
  try {
    const dailySalesData = await Order.aggregate([
      {
        $match: {
          status: 'Delivered',
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$orderDate',
            },
          },
          dailySales: {
            $sum: '$total_amount',
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    return dailySalesData;
  } catch (error) {
    throw error;
  }
}

async function calculateOrderCountByDate() {
  try {
    const orderCountData = await Order.aggregate([
      {
        $match: {
          status: 'Delivered',
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$orderDate',
            },
          },
          orderCount: { $sum: 1 },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    return orderCountData;
  } catch (error) {
    throw error;
  }
}

async function calculateProductsCount() {
  try {
    const productCount = await Products.countDocuments();

    return productCount;
  } catch (error) {
    throw error;
  }
}


async function calculateOnlineOrderCountAndTotal() {
  try {
    const onlineOrderData = await Order.aggregate([
      {
        $match: {
          paymentMethod: 'online',
          status: 'Delivered',
        },
      },
      {
        $group: {
          _id: null,
          totalPriceSum: { $sum: '$total_amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    return onlineOrderData;
  } catch (error) {
    throw error;
  }
}


async function calculateCodOrderCountAndTotal() {
  try {
    const codOrderData = await Order.aggregate([
      {
        $match: {
          paymentMethod: 'cod',
          status: 'Delivered',
        },
      },
      {
        $group: {
          _id: null,
          totalPriceSum: { $sum: '$total_amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    return codOrderData;
  } catch (error) {
    throw error;
  }
}



async function getLatestOrders() {
  try {
    const latestOrders = await Order.aggregate([
      {
        $unwind: '$products',
      },
      {
        $sort: {
          date: -1,
        },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      {
        $addFields: {
          username: {
            $arrayElemAt: ['$userDetails.name', 0],
          },
          address: {
            $arrayElemAt: ['$userDetails.address.name', 0],
          },
        },
      },
      {
        $project: {
          userDetails: 0,
        },
      },
    ]);

    return latestOrders;
  } catch (error) {
    throw error;
  }
}




async function calculateListedCategoryCount() {
  try {
    const listedCategoryCount = await Category.countDocuments({ isListed: true });

    return listedCategoryCount;
  } catch (error) {
    throw error;
  }
}



const getDashboard = async (req, res) => {
  try {

    const ordersData = await calculateDeliveredOrderTotal()
    const orders = ordersData[0]
    const categorySales = await calculateCategorySales()
    const salesData = await calculateDailySales()
    const salesCount = await calculateOrderCountByDate()
    const categoryCount = await calculateListedCategoryCount()
    const productsCount = await calculateProductsCount()
    const onlinePay = await calculateOnlineOrderCountAndTotal()
    const codPay = await calculateCodOrderCountAndTotal()
    const latestorders = await getLatestOrders()

       console.log(ordersData,"get dashBorde rsData")
    //  console.log(orders,"get dashBordorders")
       console.log(categorySales,"get dashBorders categorySales")
      //  console.log(salesData,"get dashBorders  salesData")
      //  console.log(salesCount,"get dashBordersData salesCount")
       console.log(categoryCount ,"get dashBorders categoryCount ")
      //  console.log(productsCount,"get dashBorders productsCount")
      //  console.log(onlinePay,"get dashBord onlinePay")
      //  console.log(codPay,"get dashBord codPay")
      //  console.log(latestorders,"get dashBord latestorders")
      //  console.log("productsCount:", productsCount);
       console.log("categoryCount:", categoryCount);
      // console.log("onlinePay.totalPriceSum:", onlinePay[0].totalPriceSum);
      // console.log("onlinePay.count:", onlinePay[0].count);
    // console.log('uasername', latestorders)

    res.render('home', {
      orders, productsCount, categoryCount,
      onlinePay: onlinePay[0], salesData, order: latestorders, salesCount,
      codPay: codPay[0], categorySales
    })

  }
  catch (error) {
    // res.render('/error')
    console.log(error.message);
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
  walletDispaly,
  singleOrderDetails,
  adminOrderDetails,
  getOrderInvoice,
  updateStatus,
  getDashboard

}