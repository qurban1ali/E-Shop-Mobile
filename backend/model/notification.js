const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["orders", "promotions", "system", "chat"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },

    status: {
      type: String,
      enum: ["Read", "Unread"],
      default: "Unread",
    },

    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    redirect_link: String,
    data: Object,
  },
  { timestamps: true }
);

// virtual → support `id` for frontend
notificationSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

notificationSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Notification", notificationSchema);
