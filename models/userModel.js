const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        require:true
    },
    email:{
        type:String,
        require:true
    },
    mobile:{
        type:String,
        require:true
    },
    password:{
        type:String,
        require:true
    },
    otp:{
      type:Number,
      require:true
  },
    is_admin:{
        type:Boolean,
        require:true
    },
    is_varified:{
        type:Number,
        default:0
    }
   
});



module.exports = new mongoose.model("users",userSchema);