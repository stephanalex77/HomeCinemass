const User = require("../models/categoryModel");
const Multer = require('multer');


const getCategory = async (req, res)=>{
  try {
      res.render('categories')
  } catch (error) {
      console.log(error);
  }
}



const insertCategory= async(req, res)=>{
  try {
      
    const category = new Category({
      categoryname: req.body.categoryname,
      description: req.body.description,
      img: req.body.img,
      is_listed: true
    });

    
  } catch (error) {
      console.log(error)
  }
}


module.exports = {
  getCategory,
  insertCategory
 
}