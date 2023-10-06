const Product = require("../models/productModel");
const path = require("path");
const cropImage = require("../multer/cropProductImg");
const User = require("../models/userModel");
const validator = require("validator")
const Category = require("../models/categoryModel")


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
    if (!req.files || req.files.length===0) {
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









// GET PRODUCT DELAILS AT USER SIDE
const getProductDetails = async (req, res) => {
  try {
    const productId = req.params.productId;
    // console.log("=============================================");
    // console.log(productId);
    // console.log("=============================================");
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

// SHOW PRODUCT DETAILS AT USER SIDE
const showProductDetails = async (req, res) => {
  try {
    const productId = req.params.productId;
    // console.log("============================================");
    // console.log(productId);
    const product = await Product.findOne({_id:productId});
    const userId = req.session.user_id;
    const user = await User.findById({ _id: userId });
    // console.log("++++++++++++++++++");
    if (!product) {
   
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
    const products = await Product.find();
    const categories = await Category.find();

    
    res.render("productList", {  products, categories  });
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
    const userId = req.session.user_id; // Adjust the key based on what you set in your session
    const user = await User.findOne({ _id: userId });

    const products = await Product.find();
    const categories = await Category.find();

    
    res.render("shop", { user, products, categories  });
    await cropImage.crop(req);
  } catch (error) {
    console.log(error.message);
    
  }
}

const getProductInsideCategory = async(req, res)=>{
  try {
    const categoryId = req.params.categoryId;
    console.log(categoryId);
    // If the category is "all," retrieve all products
    if (categoryId === 'all') {
      const products = await Product.find();
      res.json(products);
      console.log('Filtered products 1:', products);
    } else {
      // Otherwise, filter products by the specified category ID
      const products = await Product.find({ category_id: categoryId });
      res.json(products);
      console.log('Filtered products 2:', products);
    }
    // console.log('Filtered products:', products);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ error: 'An error occurred while fetching products' });
  }
}


module.exports = {
  getProduct,
  addProduct,
  listProduct,
  getProductDetails,
  showProductDetails,
  editProduct,
  editproductLoad,
  getShopProduct,
  getProductInsideCategory
};
