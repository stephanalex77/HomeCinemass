const Category = require("../models/categoryModel");
const Multer = require('multer');



const getCategory = async (req, res)=>{
  try {
    const categories = await Category.find();
      res.render('categories',{categories})
  } catch (error) {
      console.log(error);
  }
}


// add category
const addCategory= async(req, res)=>{

  try {
      const { categoryname, description} = req.body;

    const category = new Category({
      categoryname: req.body.categoryname,
      description: req.body.description,
      
    });
  
    const savedCategory = await category.save();

    res.redirect('category')
  } catch (error) {
      console.log(error)
  }
}


// edit category

// const editCategory = async(req, res)=>{
//   try {
//     const categoryId=req.params.categoryId;
//     const categories = await categories.findById(categoryId)
//     res.render('category',{categories})
//   } catch (error) {
    
//   }
// }

// category unlist


// category list




module.exports = {
  getCategory,
  addCategory,

  
 
}