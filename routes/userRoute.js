const express = require("express");
const user_route = express();
const session = require("express-session");

const config = require("../config/config");



user_route.use(session({secret:config.sessionSecret,
resave:true,
saveUninitialized:false
}))

const auth = require("../middleware/auth")

user_route.set('view engine','ejs')
user_route.set('views','./views/users');

// const bodyParser = require('body-parser');
// user_route.use(bodyParser.json());
// user_route.use(bodyParser.urlencoded({extended:true}))


user_route.use(express.json());
user_route.use(express.urlencoded({extended:true}))




const multer = require("multer");
const path = require("path");

user_route.use(express.static('public'))



const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname,'../public/userImages'))
    },
    filename:function(req,file,cb){
        const  name = Date.now()+'-'+file.originalname;
        cb(null,name);
    }
})
const upload = multer({storage:storage});


const userController = require("../controllers/userController");
const cartController = require("../controllers/cartController")
const productController = require("../controllers/productController")

user_route.get('/register',auth.isLogout,userController.loadRegister);

user_route.post('/register',userController.insertUser);

user_route.post('/otp', userController.insertUser)

user_route.post('/verifyotp',userController.verifyOtp)

user_route.get('/',auth.isLogout,userController.homeLoad);

user_route.get('/login',auth.isLogout,userController.loginLoad);

user_route.post('/login',userController.verifyLogin)

user_route.get('/registeration',userController.loadRegister)

user_route.get('/home',auth.isLogin,userController.loadHome)

user_route.get('/logout',auth.isLogin,userController.userLogout)


// cart management

user_route.get('/cartt', auth.isLogin, cartController.getCart)

user_route.post('/add-item-to-cart',auth.isLogin,cartController.addToCart)

user_route.delete('/removeFromCart/:productId', auth.isLogin, cartController.removeFromCart)

user_route.get('/checkoutpage', auth.isLogin, cartController.getCheckOutPage)

// user_route.post('/update-quantity/:productId', auth.isLogin,cartController.updateQuantity)
user_route.post('/update-quantity/:operation', auth.isLogin,cartController.updateQuantity)


// product details 

user_route.get('/productDetails/:productId',productController.getProductDetails)

user_route.get('/singleProduct/:productId',productController.showProductDetails)

//USER PROFILE
user_route.get('/profile',auth.isLogin,userController.goToProfile);

user_route.post('/add-address', auth.isLogin, userController.addAddressToProfile)

user_route.post('/change-password', auth.isLogin, userController.changePassword)


module.exports = user_route