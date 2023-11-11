const Category = require("../models/categoryModel");
const Multer = require("multer");

const getCategory = async (req, res) => {
  try {
    const categories = await Category.find();
    res.render("categories", { categories });
  } catch (error) {
    console.log(error);
  }
};

// add category
const addCategory = async (req, res) => {
  try {
    const { categoryname} = req.body;
    
  
    // const category = new Category({
    //   categoryname: req.body.categoryname,
    // });

    if (!categoryname) {
      res.send("Category name cannot be empty");
      return;
    }
    if (categoryname.length < 3) {
      alert("Category name must be at least 3 characters long");
      return false;
    }
    
    const existingCategory = await Category.findOne({
      categoryname: { $regex: '^' + categoryname + '$', $options: 'i' }
    });
    // const categories = await Category.find();
    if(existingCategory){
      res.send("Category already exists");
    }else{
      const newCategory = new Category({
        categoryname: req.body.categoryname,
        OfferPrice:req.body.OfferPrice
      });
      await newCategory.save();
      if(newCategory){
        
      res.redirect("/admin/category");
      }
    }

  } catch (error) {
    res.status(500).json({ error: 'Failed to add category' });
  }
};

//edit category

const editCategory = async(req, res)=>{
  try {
    const categoryId=req.params.categoryId;
    const categories = await categories.findById(categoryId)
    res.render('category',{categories})
  } catch (error) {

  }
}







const listCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const validCategoryId = new mongoose.Types.ObjectId(categoryId);
    await Category.findByIdAndUpdate(validCategoryId, { isListed: true });
    res.redirect(302, '/admin/categories'); // Redirect back to the categories page
  } catch (error) {
    console.error('Error listing category:', error.message);
    res.status(500).json({ success: false, message: 'An error occurred while listing the category' });
  }
};

const unListCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const validCategoryId = new mongoose.Types.ObjectId(categoryId);
    await Category.findByIdAndUpdate(validCategoryId, { isListed: false });
    res.redirect(302, '/admin/categories'); // Redirect back to the categories page
  } catch (error) {
    console.error('Error unlisting category:', error.message);
    res.status(500).json({ success: false, message: 'An error occurred while unlisting the category' });
  }
};


const deleteCategory = async (req, res) => {
  try {
    const id = req.query.id;
    console.log("Deleting category with ID:", id);
    await Category.deleteOne({ _id: id });
    console.log("Category deleted successfully.");

    res.redirect("/admin/category");

  } catch (error) {
    console.log(error.message);
  }
};

const loadCategoryOffer = async (req, res) => {
  try {
    const id = req.query.id;
    console.log("Deleting category with ID:", id);
    await Category.findOne({ _id: id });
    console.log("Category deleted successfully.");
    res.render("/admin/category");
  } catch (error) {
    console.log(error.message);
  }
};

const categoryOffer = async(req, res)=>{
  try {
    res.render("categoryOffer");
  } catch (error) {
    console.log(error.message);
  }
}


module.exports = {
  getCategory,
  addCategory,
  unListCategory,
  listCategory,
  deleteCategory,
  loadCategoryOffer,
  categoryOffer

};
