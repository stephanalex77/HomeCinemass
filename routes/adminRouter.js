const express = require("express")
const admin_route = express();
const uploadProduct = require('../multer/productMulter')
const session = require("express-session")
const config = require("../config/config");



admin_route.use(session({secret:config.sessionSecret,
    resave:true,
    saveUninitialized:false
}))


admin_route.use("/public", express.static("public"));
// const bodyParser = require("body-parser");
// admin_route.use(bodyParser.json());
// admin_route.use(bodyParser.urlencoded({extended:true}));

admin_route.use(express.json());
admin_route.use(express.urlencoded({extended:true}))




admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin');

const auth = require("../middleware/adminAuth")

const adminController = require("../controllers/adminController");

const categoryController= require("../controllers/categoryController")

const productController= require("../controllers/productController")

const couponController = require("../controllers/couponController")
// user side

admin_route.get('/',auth.isLogout,adminController.loadLogin)

admin_route.post('/', adminController.verifyLogin)

admin_route.get('/home',auth.isLogin,adminController.loadDashboard);

admin_route.get('/logout',auth.isLogin,adminController.logout)

admin_route.get('/users',auth.isLogin, adminController.getUsers)

admin_route.get('/users',auth.isLogin,adminController.adminDashboard);


// admin_route.post('/users',adminController.user_toggle)

admin_route.get('/block',auth.isLogin, adminController.blockUser)
admin_route.get('/unblock',auth.isLogin, adminController.unblockuser)


// category get and post
admin_route.get('/category',auth.isLogin, categoryController.getCategory)

admin_route.post('/category',auth.isLogin, categoryController.addCategory)



admin_route.post('/category/list/:_id',auth.isLogin, categoryController.listCategory);

admin_route.post('/category/unlist/:_id',auth.isLogin, categoryController.unListCategory);

// admin_route.get('/category/list/:_id',auth.isLogin, categoryController.listCategory);

// admin_route.get('/category/unlist/:_id',auth.isLogin, categoryController.unListCategory);

admin_route.get('/categories/delete-category',auth.isLogin,categoryController.deleteCategory);

// Route to list a category
admin_route.get('/admin/categories/list/:categoryId',auth.isLogin, categoryController.listCategory);

// Route to unlist a category
admin_route.get('/admin/categories/unlist/:categoryId',auth.isLogin, categoryController.unListCategory);





// product management

admin_route.get('/products',auth.isLogin, productController.getProduct);

admin_route.post('/products',auth.isLogin, uploadProduct.array('images',4), productController.addProduct)
 
admin_route.get('/productlist',auth.isLogin, productController.listProduct)

admin_route.get('/editProduct/:id',auth.isLogin, productController.editproductLoad)

admin_route.post('/editProduct/:id',auth.isLogin, uploadProduct.array('images',4),productController.editProduct)




// Assuming you have fetched the 'users' data and stored it in a variable called 'users'

admin_route.get('/productList',auth.isLogin, adminController.editUserLoad);

//COUPON MANAGEMENT
admin_route.get('/coupon',auth.isLogin, couponController.getCoupon);
admin_route.use(express.urlencoded({ extended: true }));

admin_route.post('/coupon',auth.isLogin, couponController.addCoupon)


admin_route.get('/coupons/delete-coupon',auth.isLogin, couponController.deleteCoupon)

admin_route.get('*',function(req,res){
    res.status(404).send('Page Not Found');
})

module.exports = admin_route;