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
    ],
    shippingAddress: {
        type:String
    },
    status: {
      type: String,
      enum: ['placed', 'shipped', 'Delivered', 'Cancelled', 'Returned'],
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
  createdAt:{
    type:Date
  }
  }, { timestamps: true });
  
module.exports = mongoose.model('Order', orderSchema);