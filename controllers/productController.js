const Product = require("../models/productModel");
const path = require("path");
const cropImage = require("../multer/cropProductImg");
const User = require("../models/userModel");
const validator = require("validator")
const Category = require("../models/categoryModel")
const Cart = require("../models/cartModel")
const mongoose = require('mongoose')


const getProduct = async (req, res) => {
  try {
    const categories = await Category.find()
    res.render("product", {categories});
  } catch (error) {
    console.log(error.message);
  }
};



// ADD PRODUCT AT ADMIN SIDE
const addProduct = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).send("No files were uploaded.");
    }
    const images = req.files.map((file) => file.filename);
    await cropImage.crop(req);

    const category = await Category.findOne({ name: req.body.categoryName });

    if (!category) {
      return res.status(400).json({ error: "Category not found" });
    }

    // Calculate the product_sales_price with a discount
    const product_price = req.body.product_price;
    const specialOffer = req.body.product_sales_price; 
    const discount = (product_price * specialOffer) / 100;
    const product_sales_price = product_price - discount;

    const product = new Product({
      product_name: req.body.product_name,
      product_price: product_price, 
      product_sales_price: product_sales_price, 
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










// GET PRODUCT DELAILS AT USER SIDE
const getProductDetails = async (req, res) => {
  try {
    const productId = req.params.productId;
    // console.log("=============================================");
    // console.log(productId);
    // console.log("=============================================");
    const product = getProductDetails(productId);
    if (!product) {
      return res.status(404).send("Product not found");
    }
    res.render("users/productDetails", { product });
    // const products = await Product.find();
    // res.render("productDetails", { product });
  } catch (error) {
    console.log(error);
  }
};

// SHOW PRODUCT DETAILS AT USER SIDE
const showProductDetails = async (req, res) => {
  try {

    const productId = req.params.productId;
    // console.log("============================================");
    // console.log(productId);
    const product = await Product.findOne({_id:productId});
    const userId = req.session.user_id;
    const user = await User.findById({ _id: userId });
    const category = await Category.findById(product.category_id);
    const cart = await Cart.findOne({ user: userId });

    // console.log("++++++++++++++++++");
    if (!product) {
   
      return res.status(404).send("Product not found");
    }
    res.render("singleProduct", {user, product, categoryName: category.categoryname, cart  });
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
    const categories = await Category.find();
      // console.log(categories);
      // res.render("categories", { categories });
    if(product){
      res.render('editProduct', { product, categories });
    }else{
      res.redirect('/admin')
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
};

//LIST PRODUCT AT ADMIN SIDE
const listProduct = async (req, res) => {
  try {
    const products = await Product.find().populate('category_id');
    const categories = await Category.find();

    const itemsPerPage = 6;
     const currentpage = parseInt(req.query.page) || 1;
     const startIndex = (currentpage - 1) * itemsPerPage;
     const endIndex = startIndex + itemsPerPage;
     const totalpages = Math.ceil(products.length / itemsPerPage);
     const pages = Array.from({ length: totalpages }, (_, i) => i + 1); // Create an array of page numbers
     const currentproduct = products.slice(startIndex, endIndex);

    res.render("productList", {  categories, products:currentproduct,pages,currentpage, totalpages });
    await cropImage.crop(req);
  } catch (error) {
    console.log(error.message);
  }
};


// EDIT PRODUCT
const editProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const {
      product_id,
      product_name,
      description,
      product_price,
      product_sales_price,
      category_id,
      quantity,
    } = req.body;

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
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getShopProduct = async(req, res)=>{
  try {
     let sortList ;
     if(req.query.asc){
      sortList={product_sales_price:1}
     }
     if(req.query.desc){
      sortList={product_sales_price:-1}
     }

     let query={}



    //  const products = await Product.find();
    const products = await Product.find({}).sort(sortList);
    const userId = req.session.user_id; 
    const user = await User.findOne({ _id: userId });
    const categories = await Category.find();
    const cart = await Cart.findOne({ user: userId });
    
     const itemsPerPage = 6;
     const currentpage = parseInt(req.query.page) || 1;
     const startIndex = (currentpage - 1) * itemsPerPage;
     const endIndex = startIndex + itemsPerPage;
     const totalpages = Math.ceil(products.length / itemsPerPage);
     const pages = Array.from({ length: totalpages }, (_, i) => i + 1); // Create an array of page numbers
     const currentproduct = products.slice(startIndex, endIndex);
     
    //  console.log(orders,"ods");

    res.render("shop", { user, products:currentproduct, categories,pages,currentpage, totalpages ,cart });
    // await cropImage.crop(req);
  } catch (error) {
    console.log(error.message);
    
  }
}

const getProductInsideCategory = async(req, res)=>{
  console.log('getProductInsideCategory called');
  const productCategory = req.body.productCategory;
  const productRange = req.body.productRange;
  let sort = req.body.sort
  let serarch = req.body.search;
  let rangeFilter = []
  let filter = { }
  if (serarch) {
    const regex = new RegExp('^' + serarch, 'i');
    filter.product_name = regex
  }
  if (productCategory) {
    filter.category_id = { $in: productCategory }
  }

  console.log("productCategory================",productCategory)
  console.log("productRange================",productRange)


  if (productRange) {
    for (let i = 0; i < productRange.length; i++) {
      const el = productRange[i];
      if (el === 'lt15000') {
        rangeFilter.push({ product_sales_price: { $lte: 15000 } });
      }
      if (el === 'lt40000') {
        rangeFilter.push({ product_sales_price: { $gt: 15000, $lte: 40000 } });
      }
      if (el === 'lt80000') {
        rangeFilter.push({ product_sales_price: { $gt: 40000, $lte: 80000 } });
      }
      if (el === 'lt150000') {
        rangeFilter.push({ product_sales_price: { $gt: 80000, $lte: 150000 } });
      }
      if (el === 'lt200000') {
        rangeFilter.push({ product_sales_price: { $gt: 150000, $lte: 200000 } });
      }
      if (el === 'gt200000') {
        rangeFilter.push({ product_sales_price: { $gt: 200000 } });
      }
    }
  }

  // console.log("range filter::::",rangeFilter );
  if (rangeFilter.length)
    filter.$or = rangeFilter

console.log("range filter::::",rangeFilter );
  console.log(":=:=:===:=:=:",filter)
  if (sort) {
    if (sort == 'HL') {
      sort = { product_sales_price: -1 }
    }
    if (sort == 'LH') {
      sort = { product_sales_price: 1 }
    }
    if (sort == 'NA') {
      sort = { date: -1 }
    }
  } else {
    sort = { date: -1 }
  }
  
  const products = await getFilteredProducts(filter, sort);
  console.log("=======>",products)





  const itemsPerPage = 6;
  let currentPage = parseInt(req.body.page);
  if (isNaN(currentPage)) {
    currentPage = 1;
  }
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = products.slice(startIndex, endIndex);
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }
  if (products.length) {
    res.json({ products: paginatedProducts, currentPage, totalPages, pages })
  } else {
    res.json({ noProducts:true})
}

};
const getFilteredProducts = async (filter, sort) => {
  try {
    console.log('Filter:', filter);
    const products = await Product.find(filter).sort(sort);
    console.log('Filtered Products:', products);
    return products;
  } catch (error) {
    console.error(error);
    throw error;
  }
};








module.exports = {
  getProduct,
  addProduct,
  listProduct,
  getProductDetails,
  showProductDetails,
  editProduct,
  editproductLoad,
  getShopProduct,
  getProductInsideCategory,
  // searchProduct,
  // getFilterName
};
