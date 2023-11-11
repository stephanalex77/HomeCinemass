const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required:true
    },
    orderId:{
        type:String,
        // required:true
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
    reasonResponse:{
      type:String
    },
    shippingAddress: [{
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
      },
    }],
    status: {
      type: String,
      enum: ['placed', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
      default: 'placed'
    },
    orderDate: {
      type: Date,
      default: Date.now 
  },

    paymentMethod: {
      type: String,
      
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