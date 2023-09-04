const mongoose = require("mongoose")

const categorySchema = new mongoose.Schema({
  categoryname:{
    type:String,
    require:true
  },
  description:{
    type:String,
    require:true
  },
  is_listed:{
    type:Boolean,
    require:true
  }
})

module.exports = new mongoose.model("Categories",categorySchema);