const mongoose = require('mongoose');

const cartSchema  = new mongoose.Schema({
    user: {
        type:mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    products: [
        {
            product: {
                type:mongoose.Schema.Types.ObjectId,
                ref: 'Products',
            }, 
            quantity: {
                type: Number,
                default: 1,
                min: 1,
            },

            product_total:{
                type:Number,
                required:true
            }

        
        }
    ],
    cartSubtotal:{
        type:Number,
        required:true
    },
  
})

module.exports = mongoose.model('Cart', cartSchema);