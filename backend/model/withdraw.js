const mongoose = require("mongoose");

const withdrawSchema = new mongoose.Schema(
 {
    seller:{
        type: Object,
     required:true

    },
    status:{
        type:String,
        default:"Processing"
    },
    amount:{
        type:Number,
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now()
    },
    updatedAt:{
        type:Date 
    }
}

   
);

module.exports = mongoose.model("Withdraw", withdrawSchema);
