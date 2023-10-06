const mongoose = require("mongoose");
const couponSchema=new mongoose.Schema({
    coupon_name:{
        type:String,
        required:true,
        uppercase:true,
    },
    expiry:{
        type:Date,
       
        
    },
    discount:{
        type:Number,
        required:true,
    }
 

});
couponSchema.index({ coupon_name: 1}, { unique: true });

module.exports= new mongoose.model('Coupon',couponSchema)