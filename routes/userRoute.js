const express = require("express");
const user_route = express();
const session = require("express-session");

const config = require("../config/config");



user_route.use(session({secret:config.sessionSecret,
resave:false,
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
const orderController = require("../controllers/orderController")
const couponController = require("../controllers/couponController")
const wishListController = require("../controllers/wishListController")

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

user_route.get('/shipping-address-save', cartController.saveAddress)

// user_route.post('/update-quantity/:productId', auth.isLogin,cartController.updateQuantity)
user_route.post('/update-quantity/:operation', auth.isLogin,cartController.updateQuantity)


// product details 

user_route.get('/productDetails/:productId',productController.getProductDetails)

user_route.get('/singleProduct/:productId',productController.showProductDetails)

//USER PROFILE
user_route.get('/profile',auth.isLogin,userController.goToProfile);

user_route.post('/add-address', auth.isLogin, userController.addAddressToProfile)

user_route.post('/change-password', auth.isLogin, userController.changePassword)

user_route.delete('/delete-address/:userId/:addressId',auth.isLogin, userController.deleteAddress)

user_route.get('/getDeaultAddress', auth.isLogin, userController.loadDefaultAddress)

user_route.get('/makeDefault', auth.isLogin, userController.makeDefaultAddress)


//ORDER MANAGEMENT

user_route.get('/orderreview', auth.isLogin,orderController.getOrderReview)
user_route.post('/orderreview', auth.isLogin,orderController.getOrderReview)



// user_route.get('applycoupon', auth.isLogin, couponController.applyCoupon)
user_route.post('/applycoupon', auth.isLogin, couponController.applyCoupon)

// SHOP PRODUCT & FILTER PRODUCT & SHOW CATEGORY WISE PRODUCT

user_route.get('/shop', auth.isLogin, productController.getShopProduct)

user_route.get('/products/category/:categoryId', auth.isLogin, productController.getProductInsideCategory )

// WISH LIST MANAGEMENT
user_route.get('/wishlist', auth.isLogin, wishListController.getWishList)

user_route.post('/add-item-to-wishlist',auth.isLogin, wishListController.addToWishList)

user_route.delete('/removeFromWishList/:productId', auth.isLogin, wishListController.removeFromWishList)

module.exports = user_route