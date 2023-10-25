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
 


// To get cart details

const getCart = async (req, res) => {
  try {
    
    const category = await Category.find();
    const products = await Products.find();
    const userId = req.session.user_id;
    const user = await User.findById({ _id: userId });
    
    // console.log(user)
    // Find the user's cart and populate it with product details
    console.log(userId);
    const cart = await Cart.findOne({ user: userId }).populate(
      "products.product"
    );

    if (!cart) {
      // If the cart doesn't exist, create an empty cart
      const emptyCart = { products: [] };
      res.render("cart", {
        user,
        cart: populatedCart, // Use populatedCart here, assuming this is the populated cart
        category,
        products,
        calculateTotalPrice: calculateTotalPrice, // Pass calculateTotalPrice to the template
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
      console.log("this is my cart items")
      // console.log(cart)

      res.render("cart", {user, cart, category, products, calculateTotalPrice });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while processing the cart.");
  }
};

// add to cart
const addToCart = async (req, res) => {
  const userId = req.session.user_id;
  const productId = req.body.productId;
  const quantity= req.body.quantity || 1
  console.log(req.body);
  try {
    const product = await Products.findById(productId);
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
      await Cart.create({ user: userId, products: [{product:productId, quantity,product_total}],cartSubtotal});
    }
    // Check if the user already has this product in their cart
  
    // const existingProduct = cart.products?.find((item) =>
    //   item.product.equals(productId)
    // );
    // console.log(existingProduct);

    // if (existingProduct) {
      
    //   existingProduct.quantity += Number(quantity);
    //   existingProduct.product_total = existingProduct.product.product_sales_price * existingProduct.quantity;
    //   existingProduct.price = existingProduct.product_total;
    //   console.log("::::::::::::::", existingProduct.product_total);
    // } else {
      
      const productToAdd = {
        product: productId,
        quantity: quantity,
        product_total: product.product_sales_price * quantity ,
      };
      cart.products.push(productToAdd);
      console.log(":::::aaa:::",productToAdd);

      cart.cartSubtotal = cart.products.reduce((subtotal, product) => {
        return subtotal + product.product_total;
      }, 0);


    // }


    
    // console.log("kittuo???????????");
    // product.quantity-=Number(quantity) 
    // console.log("==========kittiyo");
    await product.save();

    await cart.save();

    res.status(200).json({ success: true, message:"item added to cart" });
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
const updateCart = async (req, res) => {
  const userId = req.session.user_id;
  const { productId, quantity } = req.body;
  try {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    const existingProduct = cart.products.find(cartProduct => cartProduct.product.equals(productId));
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    console.log(":::::::",quantity);
    existingProduct.quantity = quantity;
    
    console.log("asdfghjk",existingProduct.quantity);

    existingProduct.product_total = existingProduct.product_sales_price * quantity;
    console.log("existing::::::::",existingProduct.product_total);
    await cart.save();
    res.status(200).json({ success: true, message: 'Cart updated successfully' });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: 'An error occurred while updating the cart' });
  }
};



// GET CHECKOUT PAGE

const getCheckOutPage = async (req, res) => {
  const userId = req.session.user_id;
  // const userId = req.session.user_id;
  const user = await User.findById({ _id: userId })

  try {
    const cart = await Cart.findOne({ user: userId }).populate('products.product');
    
    
    if (cart && cart.products && cart.products.length > 0) {
      const totalSubtotal = cart.products.reduce((total, product) => {
        const subtotal = product.product.product_sales_price * product.quantity;
        return total + subtotal;
      }, 0);
      
     res.render('checkoutpage', { user, cart, totalSubtotal });

    } else {
      res.render('checkoutpage', {user, cart: null, totalSubtotal: 0 });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
};

const saveAddress=(req,res)=>{
  
  req.session.userAddress =req.query.address
  res.json({message:'address saved'})
  
}






const updateQuantity = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const productId = req.body.productId;
    const operation = req.params.operation; // "increment" or "decrement"

    const cart = await Cart.findOne({ user: userId }).populate("products.product");

    const product = cart.products.find((item) =>
      item._id.equals(productId)
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (operation === 'increment') {
      product.quantity += 1;
    } else if (operation === 'decrement') {
      product.quantity = Math.max(product.quantity - 1, 1);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid operation' });
    }

    // Calculate the updated product_total based on the updated quantity
    product.product_total = product.quantity * product.product.product_sales_price;
    // cart.cartSubtotal =product.product_total
    cart.cartSubtotal = cart.products.reduce((subtotal, product) => {
      return subtotal + product.product_total;
    }, 0);
    // Save the updated product and cart
    // await product.save();
    await cart.save();

    res.json({ success: true, message: `Quantity ${operation}ed successfully`, updatedQuantity: product.quantity, cart });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}






module.exports = {
  getCart,
  addToCart,
  populateProductDetails,
  updateCart,
  removeFromCart,
  getCheckOutPage,
  saveAddress,
  updateQuantity,
 
};
