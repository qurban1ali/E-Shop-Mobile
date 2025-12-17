const mongoose = require("mongoose");

const coupouneCodeSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true, "Please enter your event coupoun code name!"],
        unique: true
     },
     value:{
        type:Number,
        required:true
     },
     minAmount:{
        type:Number
     },
     maxAmount:{
        type:Number,

     },
     shop:{
       type:mongoose.Schema.Types.ObjectId,
       required:true
     },
      selectedProducts:{
         type:String
      },
    createdAt:{
            type:Date,
            default: Date.now()
        }

})


module.exports = mongoose.model("coupounCode", coupouneCodeSchema);