const Cart = require("../models/cartModel");
const Category = require("../models/categoryModel");
const Products = require("../models/productModel");
const User = require("../models/userModel");
const Coupon = require("../models/couponModel")


const getCoupon = async (req, res) => {

  try {
    const coupon = await Coupon.find()
    res.render('coupons',{coupon});
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}

const addCoupon = async (req, res) => {
  try {
    // Extract coupon_name, discount, and expiry from req.body
    const { coupon_name, discount, expiry } = req.body;

    // Check if these fields are provided in the request body
    if (!coupon_name || !discount || !expiry) {
      return res.status(400).send('Please provide coupon_name, discount, and expiry');
    }

    // Create a new Coupon instance
    const coupons = new Coupon({
      coupon_name: coupon_name,
      discount: discount,
      expiry: expiry,
    });

    // Save the new coupon to the database
    const newCoupon = await coupons.save();

    // Fetch all coupons from the database
    const allCoupons = await Coupon.find();

    // Render the view with the updated list of coupons
    if (coupons) {
      return res.render("coupons", { coupon: allCoupons, message: "Coupon added successfully" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal Server Error');
  }
}





const deleteCoupon = async (req, res) => {
  try {
    const id = req.query.id;
    console.log("======", id);
   const coupon = await Coupon.deleteOne({ _id: id });
   console.log(coupon);
   res.render("coupons",{coupon});
  } catch (error) {
    console.log(error.message);
  }
};






//APPLY COUPON FOR USER
const applyCoupon = async (req, res) => {
  try {
    const couponCode = req.body.couponCode;

    // Check if the coupon code is valid and calculate the discount
    const isValidCoupon = await checkCouponValidity(couponCode);
    if (isValidCoupon) {
      // Calculate the discount based on your coupon logic
      
      const discountAmount = calculateDiscountAmount(totalSubtotal, couponCode);

      // Calculate the new grand total
      const grandTotal = totalSubtotal - discountAmount;

      // Respond with the discount amount and the new grand total
      res.json({ success: true, discountAmount, grandTotal });
    } else {
      // Respond with an error message for an invalid coupon
      res.json({ success: false, error: 'Invalid coupon code' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

// Example function to check coupon validity (replace with your own logic)
const checkCouponValidity = async (coupon) => {
  // Implement your coupon code validation logic here (e.g., check against a database)
  // Return true if the coupon is valid, false otherwise
  return true; // Replace with your validation logic
};

// Example function to calculate discount (replace with your own logic)
const calculateDiscountAmount = (cartTotal, coupon) => {
  // Implement your coupon code calculation logic here
  // Return the discount amount based on the coupon and cart total
  // For example, you can calculate a percentage discount
  return 0; // Replace with your calculation logic
};

module.exports = { applyCoupon };


module.exports ={
  getCoupon,
  addCoupon,
  deleteCoupon,
  applyCoupon
}