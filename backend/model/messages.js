const mongoose = require ("mongoose")

const MessagesSchema = new mongoose.Schema(
   { 
      conversationId : {
        type: String,
      },
      text:{
        type:String
      },
      sender:{
        type:String
      },
      images:{
        type:String
      }
   },
   {timestamps: true}
)

module.exports = mongoose.model("Messages",MessagesSchema)