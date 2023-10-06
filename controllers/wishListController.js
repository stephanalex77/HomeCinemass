const Products = require("../models/productModel");
const Category = require("../models/categoryModel")
const cropImage = require("../multer/cropProductImg");
const User = require("../models/userModel");
// const validator = require("validator")
const Wishlist = require('../models/wishlistModel')


const getWishList = async (req, res) => {
  try {
    
    const category = await Category.find();
    const products = await Products.find();
    const userId = req.session.user_id;
    const user = await User.findById({ _id: userId });
    
    // console.log("who is the user:",user)
    // Find the user's cart and populate it with product details
    console.log(" show user id:::::::::",userId);
    const wishList = await Wishlist.findOne({ user: userId }).populate(
      "products"
    );

 
      console.log("this is my wishlist items")

      res.render("wishList", {user, wishList, category, products });
    
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while processing the wishlist.");
  }
};


const addToWishList = async (req, res) => {
  const userId = req.session.user_id;
  const { productId: product_id } = req.body;

  try {
    const product = await Products.findById(product_id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const wishlist = await Wishlist.findOne({ user: userId });

    if (wishlist) {
      // Check if the product is already in the wishlist
      if (wishlist.products.includes(product_id)) {
        // If it is, remove it from the wishlist
        wishlist.products = wishlist.products.filter(item => !item.equals(product_id));
        await wishlist.save();
        res.status(200).json({ success: true, message: "Item removed from wishlist", wishlist });
      } else {
        // If it is not, add it to the wishlist
        wishlist.products.push(product_id);
        await wishlist.save();
        res.status(200).json({ success: true, message: "Item added to wishlist", wishlist });
      }
    } else {
      // If the wishlist does not exist, create a new one with the product
      const newWishlist = new Wishlist({
        user: userId,
        products: [product_id],
      });
      await newWishlist.save();
      res.status(200).json({ success: true, message: "Item added to wishlist", wishlist: newWishlist });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the wishlist",
    });
  }
};





const removeFromWishList = async (req, res) => {
  const userId = req.session.user_id;
  const productId = req.params.productId;
  try {
    let wishList = await Wishlist.findOne({ user: userId });
    if (!wishList) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    // Use the 'filter' method to remove the product with the specified ID
    wishList.products = wishList.products.filter((item) => {
      return !item.equals(productId);
    });

    await wishList.save();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'An error occurred while removing the product from the wishlist' });
  }
};




module.exports = {
  getWishList,
  addToWishList,
  removeFromWishList
}