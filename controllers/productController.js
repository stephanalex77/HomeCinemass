const Product = require("../models/productModel");
const multer = require('multer');
const path = require('path')

const storage = multer.diskStorage({
  destination: (req, file, cb) => { 
    cb(null, 'public/uploadProduct');
  },
  filename: (req, file, cb) => {
    console.log(Date.now());
    console.log(path.extname(file.originalname));
    cb(null, Date.now()+'.webp');
  },
});




const getProduct = async (req, res)=>{
  try {
    // const products = await Product.find();
      res.render('product')
  } catch (error) {
      console.log(error);
  }
}

const addProduct = async(req, res)=>{
  try {
    if (!req.files) {
      return res.status(400).send('No files were uploaded.');
    }
    const images = req.files.map(file => file.filename);
    
    const product = new Product({
      product_name:req.body.product_name,
      product_price:req.body.product_price,
      product_sales_price:req.body.product_sales_price,
      quantity:req.body.quantity,
      description:req.body.description,
      image:images,

    });

    await product.save()
  } catch (error) {
    console.log(error);
  }
}



module.exports = {
  getProduct,
  addProduct
}