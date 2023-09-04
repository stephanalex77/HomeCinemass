const mongoose = require("mongoose")

const productSchema = new mongoose.Schema({
  product_name:{
    type:String,
    require:true
  },
  product_price:{
    type:Number,
    require:true
  },
  product_sales_price:{
    type:Number,
    require:true
  },
  quantity:{
    type:Number,
    require:true
  },
  description:{
    type:String,
    require:true
  },
  image:{
    type:Array,
    require:true
  }
})

module.exports = new mongoose.model("Products",productSchema);