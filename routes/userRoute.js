const express = require("express");
const user_route = express();
const session = require("express-session");
const config = require("../config/config");

user_route.use(session({secret:config.sessionSecret,
resave:false,
saveUninitialized:false
}))

const auth = require("../middleware/auth")
const multer = require("multer");
const path = require("path");

user_route.set('view engine','ejs')
user_route.set('views','./views/users');

user_route.use(express.json());
user_route.use(express.urlencoded({extended:true}))
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
const cartController = require("../controllers/cartController");
const productController = require("../controllers/productController");
const orderController = require("../controllers/orderController");
const couponController = require("../controllers/couponController");
const wishListController = require("../controllers/wishListController");



user_route.get('/register',auth.isLogout,userController.loadRegister);
user_route.post('/register',userController.insertUser);
user_route.post('/otp', userController.insertUser);
user_route.post('/verifyotp',userController.verifyOtp);
user_route.get('/',auth.isLogout,userController.homeLoad);
user_route.get('/login',auth.isLogout,userController.loginLoad);
user_route.post('/login',userController.verifyLogin);
user_route.get('/registeration',userController.loadRegister);
user_route.get('/home',auth.isLogin,userController.loadHome);
user_route.get('/logout',auth.isLogin,userController.userLogout);
user_route.get('/forget',userController.forgetLoad)
user_route.post('/forget',userController.forgetVerify)
user_route.get('/forgetOtp',userController.verifyOtpLoad)
user_route.post('/forgetVerify',userController.verifyResetOtp)
user_route.post('/resendForgot',userController.resendForget)
user_route.get('/resetPassword',userController.resetPassword)
user_route.post('/resetPassword',userController.resetNewPassword)

// cart management
user_route.get('/cartt', auth.isLogin, auth.isBlock, cartController.getCart);
user_route.post('/add-item-to-cart',auth.isLogin,auth.isBlock,cartController.addToCart);
user_route.delete('/removeFromCart/:productId', auth.isLogin, cartController.removeFromCart);
user_route.get('/checkoutpage', auth.isLogin,auth.isBlock, cartController.getCheckOutPage);
user_route.get('/shipping-address-save',auth.isLogin, auth.isBlock, cartController.saveAddress);
user_route.post('/update-quantity/:operation', auth.isLogin,auth.isBlock,cartController.updateQuantity);

// product details 
user_route.get('/productDetails/:productId',productController.getProductDetails);
user_route.get('/singleProduct/:productId',productController.showProductDetails);

//USER PROFILE
user_route.get('/profile',auth.isLogin,auth.isBlock,userController.goToProfile);
user_route.post('/add-address', auth.isLogin,auth.isBlock, userController.addAddressToProfile);
user_route.post('/change-password', auth.isLogin, userController.changePassword);
user_route.delete('/delete-address/:userId/:addressId',auth.isLogin, userController.deleteAddress);
user_route.get('/getDeaultAddress', auth.isLogin, userController.loadDefaultAddress);
user_route.get('/makeDefault', auth.isLogin, userController.makeDefaultAddress);
user_route.get('/getEditAddress', auth.isLogin, userController.loadEditAddress);
user_route.post('/edit-address/:userId/:addressId', auth.isLogin, userController.editAddress);
user_route.get('/changepassword',auth.isLogin, userController.loadChangePassword);

//ORDER MANAGEMENT
user_route.get('/orderreview', auth.isLogin,auth.isBlock,orderController.getOrderReview);
user_route.post('/orderreview', auth.isLogin,auth.isBlock,orderController.getOrderReview);
user_route.post('/createOrder', auth.isLogin, auth.isBlock,orderController.createOrder);
user_route.get('/orders', auth.isLogin, auth.isBlock,orderController.showorder);
user_route.post('/makeorder', auth.isLogin, auth.isBlock,orderController.makeOrder);
user_route.post('/verifyPayment',auth.isLogin,auth.isBlock,orderController.verifyRazorpayPayment);
user_route.get('/orders/:orderId', auth.isLogin,auth.isBlock, orderController.showorder);
user_route.get('/view-order/:userId/:orderId',auth.isLogin,auth.isBlock, orderController.singleOrderDetails)
user_route.post('/ordercancel',auth.isLogin, auth.isBlock,orderController.cancelOrder);
user_route.post('/orderreturn', auth.isLogin,auth.isBlock, orderController.returnOrder);
user_route.get('/orderthankyou', auth.isLogin, auth.isBlock,orderController.getOrderThankyou);
user_route.get('/invoice', auth.isLogin, auth.isBlock, orderController.getOrderInvoice)
user_route.post('/couponget', auth.isLogin,auth.isBlock, couponController.applyCoupon);
user_route.get('/coupons/:cartid', auth.isLogin, auth.isBlock,couponController.couponGet)
user_route.get('/wallet',auth.isLogin,auth.isBlock, orderController.walletDispaly);

// SHOP PRODUCT & FILTER PRODUCT & SHOW CATEGORY WISE PRODUCT
user_route.get('/shop', auth.isLogin, productController.getShopProduct)
user_route.post('/filterProduct', auth.isLogin, productController.getProductInsideCategory )

// WISH LIST MANAGEMENT
user_route.get('/wishlist', auth.isLogin, wishListController.getWishList)
user_route.post('/add-item-to-wishlist',auth.isLogin, wishListController.addToWishList)
user_route.delete('/removeFromWishList/:productId', auth.isLogin, wishListController.removeFromWishList)


module.exports = user_route
