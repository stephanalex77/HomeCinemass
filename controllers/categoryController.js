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
const unListCategory = async(req, res) =>{
  try{
      console.log('unlisstt')
      const categoryId = req.params.categoryId;
      console.log(categoryId)
      const validCateogryId = new mongoose.Types.ObjectId(categoryId);
      await Category.findByIdAndUpdate(validCateogryId, {isListed: false});
      
      res.redirect(302,'/category')
  }catch(error){
      console.log(error.message);
  }
}

// category list
const listCategory = async(req, res)=>{
  try{ 
      console.log('listtt')
      const categoryId = req.params.categoryId;
      const validCategoryId = new mongoose.Types.ObjectId(categoryId);
      await Category.findByIdAndUpdate(validCategoryId, {isListed: true});
      res.redirect(302,'category')
  }catch(error){
      console.log(error.message)
  }
}



module.exports = {
  getCategory,
  addCategory,
  unListCategory,
  listCategory
  
 
}