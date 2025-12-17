const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    groupTitle: {
      type: String,
    },
    members: {
      type: [String], // Array of user IDs
    },
    lastMessage: {
      type: String,
      default: "",
    },
    lastMessageId: {
      type: String,
      default: "",
    },
    unreadCount: {
      type: Map, // key: userId, value: number
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", conversationSchema);
