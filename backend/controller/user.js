const express = require("express");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const { upload } = require("../multer");
const catchAsyncError = require("../middleware/catchAsyncError");
const sendToken = require("../utils/jwtToken");
const User = require("../model/user");
const ErrorHandler = require("../utils/ErrorHandler");
const sendMail = require("../utils/sendMail");
const { isAuthenticated, isAdmin } = require("../middleware/auth");
const FormData = require("form-data");
const fetch = require("node-fetch");

const router = express.Router();

// ---------------- CREATE USER ----------------
router.post("/create-user", async (req, res, next) => {
  try {
    const { name, email, password, avatarUrl } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new ErrorHandler("User already exists", 400));
    }

    const user = { name, email, password, avatar: { url: avatarUrl || "" } };
    const activationToken = createActivationToken(user);
    const activationUrl = `https://e-shop-tutorial-juch.vercel.app/activation/${activationToken}`;

    await sendMail({
      email: user.email,
      subject: "Activate your account",
      message: `Hello ${user.name}, please click the link to activate your account: ${activationUrl}`,
    });

    res.status(201).json({
      success: true,
      message: `Please check your email (${user.email}) to activate your account.`,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// ---------------- CREATE ACTIVATION TOKEN ----------------
const createActivationToken = (user) => {
  return jwt.sign(
    {
      name: user.name,
      email: user.email,
      password: user.password,
      avatar: user.avatar,
    },
    process.env.ACTIVATION_SECRET,
    { expiresIn: "2h" }
  );
};

// ---------------- ACTIVATE USER ----------------
router.post(
  "/activation",
  catchAsyncError(async (req, res, next) => {
    try {
      const { activation_token } = req.body;
      const decoded = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET
      );

      let user = await User.findOne({ email: decoded.email });
      if (user) return next(new ErrorHandler("User already exists", 400));

      user = await User.create({
        name: decoded.name,
        email: decoded.email,
        password: decoded.password,
        avatar: decoded.avatar,
      });

      sendToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// ---------------- LOGIN ----------------
router.post(
  "/login-user",
  catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new ErrorHandler("Please provide all fields", 400));
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) return next(new ErrorHandler("User doesn't exist", 400));

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return next(new ErrorHandler("Invalid email or password", 400));
    }

    sendToken(user, 201, res);
  })
);

// ---------------- LOAD USER ----------------
router.get(
  "/getuser",
  isAuthenticated,
  catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user._id);
    if (!user) return next(new ErrorHandler("User not found", 400));

    res.status(200).json({ success: true, user });
  })
);

// ---------------- LOGOUT ----------------
router.get(
  "/logout",
  isAuthenticated,
  catchAsyncError(async (req, res, next) => {
    res.cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });

    res.status(201).json({
      success: true,
      message: "Logout successfully",
    });
  })
);

// ---------------- UPDATE AVATAR ----------------
router.put(
  "/update-avatar/:id",
  catchAsyncError(async (req, res, next) => {
    const { avatarUrl } = req.body; // frontend sends Cloudinary secure_url
    const user = await User.findById(req.params.id);
    if (!user) return next(new ErrorHandler("User not found", 404));

    user.avatar = { url: avatarUrl };
    await user.save();

    res.status(200).json({ success: true, user });
  })
);

// ---------------- UPLOAD AVATAR TO IMAGEKIT (SECURE) ----------------
router.post(
  "/upload-avatar",
  isAuthenticated,
  upload.single("avatar"), // using multer to handle file
  catchAsyncError(async (req, res, next) => {
    try {
      if (!req.file) {
        return next(new ErrorHandler("Please upload an image", 400));
      }

      const file = req.file;
      const base64Image = file.buffer.toString("base64");
      const dataUrl = `data:${file.mimetype};base64,${base64Image}`;

      const formData = new FormData();
      formData.append("file", dataUrl);
      formData.append("fileName", `avatar_${req.user._id}_${Date.now()}.jpg`);
      formData.append("folder", "/profile-avatars");
      formData.append("useUniqueFileName", "true");

      const response = await fetch(
        "https://upload.imagekit.io/api/v1/files/upload",
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(
              process.env.IMAGEKIT_PRIVATE_KEY + ":"
            ).toString("base64")}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return next(
          new ErrorHandler(result.message || "ImageKit upload failed", 500)
        );
      }

      // Update user avatar
      const user = await User.findById(req.user.id);
      user.avatar = {
        public_id: result.fileId,
        url: result.url,
      };
      await user.save();

      res.status(200).json({
        success: true,
        user,
        message: "Avatar uploaded successfully",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// ---------------- UPDATE USER INFO ----------------
router.put(
  "/update-user-info",
  isAuthenticated,
  catchAsyncError(async (req, res, next) => {
    const { email, password, phoneNumber, name } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user) return next(new ErrorHandler("User not found", 400));

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return next(new ErrorHandler("Invalid password", 400));
    }

    user.name = name;
    user.email = email;
    user.phoneNumber = phoneNumber;
    await user.save();

    res.status(201).json({ success: true, user });
  })
);

// ---------------- UPDATE USER ADDRESS ----------------
router.put(
  "/update-user-addresses",
  isAuthenticated,
  catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    if (!user) return next(new ErrorHandler("User not found", 404));

    const { country, city, address1, address2, zipCode, addressType } =
      req.body;

    user.addresses.push({
      country,
      city,
      address1,
      address2,
      zipCode,
      addressType,
    });
    await user.save();

    res.status(200).json({
      success: true,
      successMessage: "Address added successfully!",
      user,
    });
  })
);

// ---------------- DELETE USER ADDRESS ----------------
router.delete(
  "/delete-user-address/:id",
  isAuthenticated,
  catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    if (!user) return next(new ErrorHandler("User not found", 404));

    user.addresses = user.addresses.filter(
      (address) => address._id.toString() !== req.params.id
    );
    await user.save();

    res.status(200).json({
      success: true,
      successMessage: "Address deleted successfully!",
      user,
    });
  })
);

// ---------------- UPDATE PASSWORD ----------------
router.put(
  "/update-user-password",
  isAuthenticated,
  catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user.id).select("+password");
    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

    if (!isPasswordMatched) {
      return next(new ErrorHandler("Old password is incorrect", 400));
    }

    if (req.body.newPassword !== req.body.confirmPassword) {
      return next(new ErrorHandler("Passwords do not match", 400));
    }

    user.password = req.body.newPassword;
    await user.save();

    res.status(200).json({ success: true, message: "Password updated" });
  })
);

// ---------------- USER INFO BY ID ----------------
router.get(
  "/user-info/:id",
  catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    res.status(201).json({ success: true, user });
  })
);

// ---------------- ADMIN ALL USERS ----------------
router.get(
  "/admin-all-users",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncError(async (req, res, next) => {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(201).json({ success: true, users });
  })
);

// ---------------- DELETE USER (ADMIN) ----------------
router.delete(
  "/delete-user/:id",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) return next(new ErrorHandler("User not found", 404));

    await User.findByIdAndDelete(req.params.id);
    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  })
);

module.exports = router;
