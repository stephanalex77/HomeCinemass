const mongoose=require('mongoose')

const walletSchema= new mongoose.Schema({

    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    balance:{
        type:Number,     
        default:0
    },
    transactions: [
        {
            date: {
                type: Date,
                default: Date.now
            },
            type: {
                type: String, 
                default: false
            },
            amount: {
                type: Number,
                default: false
            }
        }
    ]
},
{ timestamps: true }
)

module.exports = mongoose.model('Wallet',walletSchema)
