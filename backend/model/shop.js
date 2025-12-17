const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const withdraw = require("./withdraw");

const shopSchema = new mongoose.Schema({
  // Add these fields inside shopSchema
followers: [
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    followedAt: {
      type: Date,
      default: Date.now,
    },
  },
],
totalSales: {
  type: Number,
  default: 0,
},
ratings: {
  type: Number,
  default: 5.0,
},
ratingCount: {
  type: Number,
  default: 0,
},
coverBanner: {
  url: {
    type: String,
    default: "https://via.placeholder.com/300x120/4F46E5/ffffff?text=Shop+Banner",
  },
},
category: {
  type: String,
  default: "General",
},


// 
  name: {
    type: String,
    required: [true, "Please enter your shop name!"],
  },
  email: {
    type: String,
    required: [true, "Please enter your shop email!"],
  },
  password: {
    type: String,
    required: [true, "Please enter your password"],
    minLength: [4, "Password should be greater than 4 characters"],
    select: false,
  },
  phoneNumber: {
    type: Number,
    required: true,
  },
  description: {
    type: String, // ✅ No longer required
  },
  address: {
    type: String, // ✅ Now a simple string, so "bath lahore" works
    required: true,
  },
  role: {
    type: String,
    default: "Seller",
  },
  avatar: {
    public_id: {
      type: String,
    },
    url: {
      type: String,
      required: true,
    },
  },
  zipCode: {
    type: Number,
    required: true,
  },
  withdrawMethod: {
    type: Object,
  },
  availableBalance :{
    type: Number,
    default:9
  },
  transections: [
    {
      status: {
        type: String,
        default: "Processing",
      },
      amount: {
        type: Number,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now(),
      },
      updatedAt: {
        type: Date,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  resetPasswordToken: String,
  resetPasswordTime: Date,
});

// Hash password before saving
shopSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

// Generate JWT token
shopSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

// Compare password
shopSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Shop", shopSchema);
