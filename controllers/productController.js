const Product = require("../models/productModel");
const multer = require('multer');
const path = require('path')
const cropImage = require('../multer/cropProductImg')




const getProduct = async (req, res)=>{
  try {
      res.render('product')
  } catch (error) {
      console.log(error);
  }
}

const addProduct = async(req, res)=>{
  try {
// console.log(req.body);

    if (!req.files) {
      console.log(req.files);
      return res.status(400).send('No files were uploaded.');
    }
    const images = req.files.map(file => file.filename);
    await cropImage.crop(req)
    
    const product = new Product({
      product_name:req.body.product_name,
      product_price:req.body.product_price,
      product_sales_price:req.body.product_sales_price,
      quantity:req.body.quantity,
      description:req.body.description,
      image:images,

    });

    await product.save();
  } catch (error) {
    console.log(error);
  }
}

const listProduct = async(req, res)=>{
      try {
        const products = await Product.find()
        res.render('productList',{products})
        await cropImage.crop(req)
      } catch (error) {
        
      }
}

module.exports = {
  getProduct,
  addProduct,
  listProduct
}