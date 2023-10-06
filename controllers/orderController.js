const Cart = require("../models/cartModel");
const Category = require("../models/categoryModel");
const Products = require("../models/productModel");
const User = require("../models/userModel");

const populateProductDetails = async (cart) => {
  const populatedProducts = await Promise.all(cart.products.map(async (product) => {
      const productDetails = await Products.findById(product.product);
      return { ...product.toObject(), productDetails };
  }));

  const populatedCart = cart.toObject();
  populatedCart.products = populatedProducts;
  
  return populatedCart;
};


const getOrderReview = async(req, res)=>{
  const userId = req.session.user_id;
  
  console.log("===============",req.body.address01);

  const user = await User.findById({ _id: userId });

  try {
    const cart = await Cart.findOne({ user: userId }).populate('products.product');

    if (cart && cart.products && cart.products.length > 0) {
      const totalSubtotal = cart.products.reduce((total, product) => {
        const subtotal = product.product.product_sales_price * product.quantity;
        return total + subtotal;
      }, 0);

      // Find the default address
      const defaultAddress = user.address.find(address => address.is_default);

      res.render('orderreview', { user, cart, totalSubtotal, defaultAddress });

    } else {
      res.render('orderreview', { user, cart: null, totalSubtotal: 0, defaultAddress: null });
    }
  } catch (error) {
    console.log(error.message);
  }
}


const postOrderReview = async(req, res)=>{
  try {
    
  } catch (error) {
    
  }
}

module.exports = {
  populateProductDetails,
  getOrderReview,
  postOrderReview
}