const mongoose = require("mongoose")

const categorySchema = new mongoose.Schema({
  categoryname:{
    type:String,
    require:true
  },
  category_id:{
    type:Number,
    require:true
  },
  description:{
    type:String,
    require:true
  },
  isListed:{
    type:Boolean,
    require:true
  }
})

module.exports = new mongoose.model("Categories",categorySchema);