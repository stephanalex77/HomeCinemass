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
const bodyParser = require("body-parser");
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({extended:true}));

admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin');

const auth = require("../middleware/adminAuth")

const adminController = require("../controllers/adminController");

const categoryController= require("../controllers/categoryController")

const productController= require("../controllers/productController")


// user side

admin_route.get('/',auth.isLogout,adminController.loadLogin)

admin_route.post('/', adminController.verifyLogin)

admin_route.get('/home',auth.isLogin,adminController.loadDashboard);

admin_route.get('/logout',auth.isLogin,adminController.logout)

admin_route.get('/users',adminController.getUsers)




// category get and post
admin_route.get('/category', categoryController.getCategory)

admin_route.post('/category', categoryController.addCategory)




// product management

admin_route.get('/products', productController.getProduct)

admin_route.post('/products',uploadProduct.array('images',4), productController.addProduct)
 
admin_route.get('/productlist',productController.listProduct)



admin_route.get('*',function(req,res){
    res.redirect('/admin');
})
module.exports = admin_route;