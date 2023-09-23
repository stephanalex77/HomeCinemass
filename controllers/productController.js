const Product = require("../models/productModel");
const path = require("path");
const cropImage = require("../multer/cropProductImg");

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

    if (!req.files) {
      console.log(req.files);
      return res.status(400).send("No files were uploaded.");
    }
    const images = req.files.map((file) => file.filename);
    await cropImage.crop(req);

    const product = new Product({
      product_name: req.body.product_name,
      product_price: req.body.product_price,
      product_sales_price: req.body.product_sales_price,
      quantity: req.body.quantity,
      description: req.body.description,
      image: images,
    });

    await product.save();
  } catch (error) {
    console.log(error);
  }
};

const listProduct = async (req, res) => {
  try {
    const products = await Product.find();
    res.render("productList", { products });
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
    console.log(product);
    console.log(product.product_name);
    // Render the product details page and pass the product data to the template
    res.render("users/productDetails", { product });

    const products = await Product.find();
    res.render("productDetails", { product });
  } catch (error) {
    console.log(error);
  }
};

const showProductDetails = async (req, res) => {
  try {
    // console.log(req.params.product_id);
    // const productId = req.params.product_id;
    const productId = req.params.productId;
    console.log(req.params.productId);
    
    console.log("=======================================khjfhjgf======");
    console.log(productId);
    console.log("=============================================");

    // const product = getProductDetails(productId);
    const product = await Product.findOne({_id:productId});

    console.log("++++++++++++++++++");
    if (!product) {
      // Handle the case where the product is not found (e.g., send an error response)
      return res.status(404).send("Product not found");
    }
    // const images = req.files.map((file) => file.filename);
    // await cropImage.crop(req);
    // Render the product details page and pass the product data to the template
    res.render("singleProduct", { product });

    // const products = await Product.find();
    // res.render("singleProduct", { product });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  getProduct,
  addProduct,
  listProduct,
  getProductDetails,
  showProductDetails,
};
