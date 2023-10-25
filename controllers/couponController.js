const Cart = require("../models/cartModel");
const Category = require("../models/categoryModel");
const Products = require("../models/productModel");
const User = require("../models/userModel");
const Coupon = require("../models/couponModel")
const mongoose = require("mongoose");


const couponList = async (req, res) => {
  try {
    console.log('couponlist function')
    const coupons = await Coupon.find()
    res.render("admin/addCoupon", { coupons });
  } catch (error) {
    res.render('/error')
  }
}

const coupons = async (req, res) => {
  try {
    console.log('couponlist function')
    const coupons = await Coupon.find()
    res.render("listCoupons", { coupons });
  } catch (error) {
    res.render('/error')
  }
}



const getCoupon = async (req, res) => {

  try {
    const coupon = await Coupon.find()
    res.render('coupons', { coupon });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}

const addCoupon = async (req, res) => {
  try {
    const { couponCode, description, discount, maxDiscount, minAmount, expirationDate } = req.body;
    console.log(req.body);
    const newCoupon = new Coupon({
      couponCode,
      description,
      discount,
      maxDiscount,
      minAmount,
      expirationDate,
      isListed: true
    });
    await newCoupon.save();

    console.log("newCoupn", newCoupon);

    res.json({ message: 'Coupon added successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal server error' });
  }

}


const editCouponPage = async (req, res) => {
  try {
    console.log('params id', req.params.id)
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).render('error', { message: 'Coupon not found' });
    }
    res.render('editCoupon', { coupon });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Internal Server Error' });
  }
}

const deleteCoupon = async (req, res) => {
  try {
    const id = req.query.id;
    console.log("======", id);
    const coupon = await Coupon.deleteOne({ _id: id });
    console.log(coupon);
    res.render("coupons", { coupon });
  } catch (error) {
    console.log(error.message);
  }
};








const editCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    const updates = req.body;

    const updatedCoupon = await Coupon.findByIdAndUpdate(couponId, updates)

    if (updatedCoupon) {
      return res.json({ success: true })
    } else {
      return res.status(400).json('error', { message: 'Coupon not found' })
    }
  } catch (error) {
    console.error(err);
    return res.status(500).json({ error: "internal server error" })
  }
}

const listCoupon = async (req, res) => {
  try {
    const couponId = req.body.couponId;
    const validCouponId = new mongoose.Types.ObjectId(couponId);
    const coupons = await Coupon.findByIdAndUpdate(validCouponId, { isListed: true });
    console.log('Coupon updated', coupons);

    res.redirect('/admin/coupons');
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
};

const unListCoupon = async (req, res) => {
  try {
    const couponId = req.body.couponId;
    const validCouponId = new mongoose.Types.ObjectId(couponId);
    const coupons = await Coupon.findByIdAndUpdate(validCouponId, { isListed: false });
    console.log('Coupon updated', coupons);

    res.redirect('/admin/coupons');
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
};

//APPLY COUPON FOR USER
// const couponGet = async (req, res) => {
//   try {

//       const calculateTotalPrice = req.session.calculateTotalPrice;
//       const currentDate = new Date();
//       const coupons = await Coupon.find({
//           isListed: true,
//           expirationDate: { $gte: currentDate }
//       });
//       res.render('couponPage', { coupons, calculateTotalPrice })
//   } catch (error) {
//       res.render('/error')
//   }
// }

const couponGet = async (req, res) => {
  try {
    const cartId = req.params.cartid;
    const cart = await Cart.findOne({ _id: cartId }); // Use the _id to find the cart
    if (cart) {
      const cartSubtotal = cart.cartSubtotal; // Get cartsubtotal from the cart document
      console.log('cartsubtotal', cartSubtotal);


      const currentDate = new Date();
      const coupons = await Coupon.find({
        isListed: true,
        expirationDate: { $gte: currentDate }
      });
      res.render('couponPage', { coupons, calculateTotalPrice: cartSubtotal });
    } else {
      // Handle the case where no cart is found with the provided _id
      res.render('/cartNotFound');
    }
  } catch (error) {
    // Handle any errors that might occur during the query
    res.render('/error');
  }
}



const applyCoupon = async (req, res) => {
  try {
    if (req.session.user_id) {
      const { couponCode } = req.body;
      const userId = req.session.user_id;
      const cart = await Cart.findOne({ user: userId });
      console.log("cart before apply::", cart);

      if (cart) {
        const coupon = await Coupon.findOne({ couponCode: couponCode });

        if (coupon) {
          // Check if the user has already used this coupon
          if (coupon.usedBy.includes(userId)) {
            res.status(400).json({ success: false, error: 'Coupon has already been used' });
          } else {
            const discountAmount = (coupon.discount / 100) * cart.cartSubtotal;
            console.log("before apply", discountAmount);
            const discountedTotal = cart.cartSubtotal - discountAmount;
            console.log("after apply", discountedTotal);

            cart.cartSubtotal = discountedTotal;
            await cart.save();

            // Add the user ID to the usedBy array in the Coupon document
            coupon.usedBy.push(userId);
            
            // Set isListed to false to hide the coupon in the list
            coupon.isListed = false;
            
            await coupon.save();

            req.session.discountAmount = discountAmount;
            res.json({
              success: true,
              couponCode: coupon.couponCode,
              discountAmount: discountAmount,
              cart: cart, // Include the updated cart in the response
            });
          }
        } else {
          res.status(404).json({ success: false, error: 'Coupon not found' });
        }
      } else {
        res.status(404).json({ success: false, error: 'Cart not found' });
      }
    } else {
      res.status(401).json({ success: false, error: 'User not logged in' });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};





module.exports = { applyCoupon };


module.exports = {
  coupons,
  couponList,
  getCoupon,
  addCoupon,
  deleteCoupon,
  editCouponPage,
  editCoupon,
  listCoupon,
  unListCoupon,
  applyCoupon,
  couponGet

}