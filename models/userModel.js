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
    },
    is_block:{
        type:Boolean,
        default:false
    },
    active: {
        type: Boolean,
        default: true 
    },
    address: [{
        firstname:{
          type: String,
        },
        lastname:{
            type: String,
          },
        email:{
            type:String,
            unique: true
        },
        mobile:{
          type: Number
        },
        address1:{
          type:String
        },
        address2:{
          type:String
        },
        pincode:{
          type:String
        },
        state:{
          type:String
        },
        
       
        city:{
          type:String
        },
         country:{
          type:String
        }    
      }]
   
});



module.exports = new mongoose.model("users",userSchema);