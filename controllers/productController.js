const Product = require("../models/productModel");
const path = require("path");
const cropImage = require("../multer/cropProductImg");
const User = require("../models/userModel");
const validator = require("validator")
const Category = require("../models/categoryModel")


const getProduct = async (req, res) => {
  try {
    res.render("product");
  } catch (error) {
    console.log(error);
  }
};

const addProduct = async (req, res) => {
  try {
    // console.log(req.body);

    if (!req.files || req.files.length===0) {
      // console.log(req.files);
      return res.status(400).send("No files were uploaded.");
    }
    const images = req.files.map((file) => file.filename);
    await cropImage.crop(req);

    const category = await Category.findOne({ name: req.body.categoryName });

    if (!category) {
      return res.status(400).json({ error: "Category not found" });
    }
    
    
    const product = new Product({
      product_name: req.body.product_name,
      product_price: req.body.product_price,
      product_sales_price: req.body.product_sales_price,
      quantity: req.body.quantity,
      description: req.body.description,
      image: images,
      category_id: category._id,
    });
    
    await product.save();
    const categories = await getCategoryList();
    res.render("admin/product", { categories });
  } catch (error) {
    console.log(error);
  }
};

const listProduct = async (req, res) => {
  try {
    const products = await Product.find();
    
    res.render("productList", {  products });
    await cropImage.crop(req);
  } catch (error) {
    console.log(error.message);
    
  }
};

const getProductDetails = async (req, res) => {
  try {

    const productId = req.params.productId;
    console.log("=============================================");
    console.log(productId);
    console.log("=============================================");

    const product = getProductDetails(productId);
    
    if (!product) {
      // Handle the case where the product is not found (e.g., send an error response)
      return res.status(404).send("Product not found");
    }
   
    // Render the product details page and pass the product data to the template
    res.render("users/productDetails", { product });

    // const products = await Product.find();
    // res.render("productDetails", { product });
  } catch (error) {
    console.log(error);
  }
};

const showProductDetails = async (req, res) => {
  try {
    // console.log(req.params.product_id);
    // const productId = req.params.product_id;
    const productId = req.params.productId;
    // console.log(req.params.productId);
    
    console.log("=======================================khjfhjgf======");
    console.log(productId);
    console.log("=============================================");

    // const product = getProductDetails(productId);
    const product = await Product.findOne({_id:productId});
    const userId = req.session.user_id;
    const user = await User.findById({ _id: userId });
    // console.log(user);

    // console.log("++++++++++++++++++");
    if (!product) {
      // Handle the case where the product is not found (e.g., send an error response)
      return res.status(404).send("Product not found");
    }
    // const images = req.files.map((file) => file.filename);
    // await cropImage.crop(req);
    // Render the product details page and pass the product data to the template
    res.render("singleProduct", {user, product });

    // const products = await Product.find();
    // res.render("singleProduct", { product });
  } catch (error) {
    console.log(error);
  }
};
//GET EDIT PRODUCT PAGE
const editproductLoad = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById( productId );
      res.render('editProduct', { product });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
};



// EDIT PRODUCT


const editProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    // Extract updated fields from the request body
    const {
      product_id,
      product_name,
      description,
      product_price,
      product_sales_price,
      category_id,
      quantity,
    } = req.body;

    // Handle the image update only if new images were uploaded
    let updatedFields = {
      product_id,
      product_name,
      description,
      product_price,
      product_sales_price,
      category_id,
      quantity,
    };

    if (req.files && req.files.length > 0) {
      const images = req.files.map((file) => file.filename);
      updatedFields.image = images;
    }


    const updatedProduct = await Product.findByIdAndUpdate(productId, updatedFields, { new: true });

    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.redirect('/admin/productlist');
  } catch (error) {
    console.error(error);
    // Handle errors and display appropriate messages
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getProduct,
  addProduct,
  listProduct,
  getProductDetails,
  showProductDetails,
  editProduct,
  editproductLoad
};
