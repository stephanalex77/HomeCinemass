const Cart = require("../models/cartModel");




const getCart = async (req, res)=>{
  try {
    const cart = await Cart.find();
      res.render('cart',{cart})
  } catch (error) {
      console.log(error);
  }
}

const addToCart = async(req, res)=>{
  try {
    const { product_id, quantity } = req.body;
    const cart = await Cart.findOne();
    cart.products.push({ product: product_id, quantity });
    await cart.save();
    res.render('addToCartt',{cart})
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
}


module.exports = {
  getCart,
  addToCart
}