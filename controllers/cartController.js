const Cart = require("../models/cartModel");
const Category = require("../models/categoryModel");
const Products = require("../models/productModel");

const populateProductDetails = async (cart) => {
  const populatedProducts = await Promise.all(cart.products.map(async (product) => {
      const productDetails = await Products.findById(product.product);
      return { ...product.toObject(), productDetails };
  }));

  const populatedCart = cart.toObject();
  populatedCart.products = populatedProducts;
  
  return populatedCart;
};



// To get cart details

const getCart = async (req, res) => {
  try {
    
    const category = await Category.find();
    const products = await Products.find();
    const userId = req.session.user_id;
 console.log('hjgj')
    // Find the user's cart and populate it with product details
    console.log(userId);
    const cart = await Cart.findOne({ user: userId }).populate(
      "products.product"
    );

    if (!cart) {
      // If the cart doesn't exist, create an empty cart
      const emptyCart = { products: [] };
      res.render("cart", {
        cart: emptyCart,
        category,
        products,
        calculateTotalPrice: 0,
      });
    } else {
      // Calculate the total price of the products in the cart
      const populatedCart = await populateProductDetails(cart);
      let calculateTotalPrice = 0;
      for (const cartProduct of cart.products) {
        const product = cartProduct.product;
        const cartQuantity = cartProduct.quantity;
        calculateTotalPrice += product.product_sales_price * cartQuantity;
      }
      console.log(cart.products[0])

      res.render("cart", { cart, category, products, calculateTotalPrice });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while processing the cart.");
  }
};

// add to cart
const addToCart = async (req, res) => {
  const userId = req.session.user_id;
  const { productId:product_id } = req.body;
  const quantity= req.body.quantity || 1

  try {
    const product = await Products.findById(product_id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "product not found" });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({ success: false, message: "Out of stock" });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, products: [] });
    }
    // Check if the user already has this product in their cart
    const existingProduct = cart.products.find((item) =>
      item.product.equals(product_id)
    );
    console.log(existingProduct);

    if (existingProduct) {
      existingProduct.quantity += Number(quantity)
    } else {
      cart.products.push({ product: product_id, quantity });
    }
    console.log("???????????");
    product.quantity-=Number(quantity)
    console.log("======= ===");
    await product.save();

    await cart.save();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while adding the product to cart");
  }
};


//REMOVE FROM CART

const removeFromCart = async(req, res)=>{
    const userId = req.session.user_id;
    const productId = req.params.productId;
    try {
      let cart = await Cart.findOne({ user: userId});
      if(!cart){
        return res.status(404).json({success: false, message: 'Cart not found'})

      }

      const productIndex = cart.products.findIndex((item)=>
      item.product.equals(productId)
      );

      if(productId === -1){
        return res.status(404).json({ success: false, message: 'Product not found in the cart'});
      }

      cart.products.splice(productIndex, 1);

      await cart.save();
      res.status(200).json({success: true});
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'An error occurred while removing the product from the cart' });
    }
  }











// UPDATE YOUR CART
const updateCart = async(req, res)=>{
  const userId = req.session.user_id
  const {productId, quantity} = req.body;
  try{
      const cart = await Cart.findOne({ user: userId});
      if(!cart){
          return res.status(404).json({ success:false,message: 'Cart not found'});
      }
      const existingProduct = cart.products.find(cartProduct =>cartProduct.product.equals(productId))
      if(!existingProduct) {
          return res.status(404).json({ success: false, message: 'Product not found'})
      } 
      existingProduct.quantity = quantity;
      await cart.save()
      res.status(200).json({ success: true, message: 'Cart updated successfully'})
  }catch(error){
      console.log(error.message)
      res.status(500).json({ success: false, message: 'An error occured while updating the cart'})
  }
}


// GET CHECKOUT PAGE

const getCheckOutPage = async (req, res) => {
  const userId = req.session.user_id;

  try {
    const cart = await Cart.findOne({ user: userId }).populate('products.product');

    // Debugging statement
    console.log('Cart:', cart);

    if (cart && cart.products && cart.products.length > 0) {
      // Iterate over products
      const totalSubtotal = cart.products.reduce((total, product) => {
        const subtotal = product.product.product_sales_price * product.quantity;
        return total + subtotal;
      }, 0);

      res.render('checkoutpage', { cart, totalSubtotal });
    } else {
      // Handle empty cart
      res.render('checkoutpage', { cart: null, totalSubtotal: 0 });
    }
  } catch (error) {
    console.log(error);
    // Handle the error gracefully
    res.status(500).send('Internal Server Error');
  }
};





module.exports = {
  getCart,
  addToCart,
  populateProductDetails,
  updateCart,
  removeFromCart,
  getCheckOutPage
};
