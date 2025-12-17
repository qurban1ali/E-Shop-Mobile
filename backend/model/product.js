const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your Product name!"],
  },
  description: {
    type: String,
    required: [true, "Please enter your Product description!"],
  },
  sizes: {
    type: [String],
    default: [],
  },
  discountPrice: Number,
colors: [String],

  category: {
    type: String,
    required: [true, "Please enter your Product category!"],
  },
  tags: {
    type: String,
    required: [true, "Please enter your Product tags!"],
  },
  originalPrice: {
    type: Number,
  },
  discountPrice: {
    type: Number,
    required: [true, "Please enter your Product Price!"],
  },
  stock: {
    type: Number,
    required: [true, "Please enter your Product stock!"],
  },
  images: [
    {
      type: String,
    },
  ],
  reviews: [
    {
      user: {
        type: Object,
      },
      rating: {
        type: Number,
      },
      comment: {
        type: String,
      },
      productId: {
        type: String,
      },
      createdAt: {
        type: Date,
        default: Date.now(),
      },
      avatar: {
        type: String, // <-- store image path or URL here
      },
    },
  ],
  ratings: {
    type: Number,
  },
  shopId: {
    type: String,
    required: true,
  },
  shop: {
    type: Object,
    required: true,
  },
  sold_out: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("Product", productSchema);
