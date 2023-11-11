const mongoose = require("mongoose")

const categorySchema = new mongoose.Schema({
  categoryname:{
    type:String,
    require:true
  },
  isListed:{
    type:Boolean,
    require:true
  },
  OfferPrice:{
    type:Number,
    require:true
}

})

module.exports = new mongoose.model("Categories",categorySchema);