const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required:true
    },
    orderId:{
        type:String
    },
    products:[
      {
        product : {
          type: mongoose.Schema.Types.ObjectId,
      ref: 'Products',
      required:true
        },
        quantity:{
          type: Number
        }
      }
    ]
      
    ,

    productPrice: {  
      type: Number,
     
   },
    shippingAddress: {
        type:String
    },
    status: {
      type: String,
      enum: ['placed', 'shipped', 'delivered'],
      default: 'placed'
    },
    paymentMethod: {
      type: String,
      enum: ['online', 'COD',],
      required: true
    },
    total_amount:{
        type:Number
    },

  }, { timestamps: true });
  
module.exports = mongoose.model('Order', orderSchema);