const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const OTP = require("../model/otp");
const ErrorHandler = require("../utils/ErrorHandler");
const sendMail = require("../utils/sendMail");
const catchAsyncError = require("../middleware/catchAsyncError");
const sendToken = require("../utils/jwtToken");

const router = express.Router();

// ✅ Generate a random 4-digit OTP
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// ✅ Send OTP email
const sendOTPEmail = async (email, otp, name) => {
  const subject = "Your OTP for Email Verification";
  const message = `
    <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #333; text-align: center;">Email Verification</h2>
        <p style="color: #666; font-size: 16px;">Hi ${name},</p>
        <p style="color: #666; font-size: 16px;">Your OTP for email verification is:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="background-color: #2563EB; color: white; font-size: 48px; font-weight: bold; letter-spacing: 10px; padding: 20px; border-radius: 8px; display: inline-block;">${otp}</div>
        </div>
        <p style="color: #999; font-size: 14px;">This OTP is valid for 10 minutes. Do not share this code with anyone.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">If you didn't request this code, you can safely ignore this email.</p>
      </div>
    </div>
  `;

 await sendMail({
  email: email,
  subject: subject,
  html: message,        // explicitly say it's HTML
  text: `Hi ${name},\n\nYour OTP for email verification is: ${otp}\n\nThis code is valid for 10 minutes.`, // plain text fallback
});
};

// ✅ USER REGISTRATION - Send OTP
router.post(
  "/user-registration",
  catchAsyncError(async (req, res, next) => {
    try {
      const { email, name, password } = req.body;

      // Validate input
      if (!email || !name || !password) {
        return next(
          new ErrorHandler("Please provide all required fields", 400)
        );
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return next(new ErrorHandler("User already exists", 409));
      }

      // Check rate limiting - max 3 OTP requests per hour
      const recentOTPs = await OTP.find({
        email: email,
        createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
      });

      if (recentOTPs.length >= 3) {
        return next(
          new ErrorHandler(
            "Too many OTP requests. Please try again later.",
            429
          )
        );
      }

      // Generate OTP
      const otp = generateOTP();

      // Delete any existing OTP for this email
      await OTP.deleteMany({ email: email });

      // Save new OTP to database
      await OTP.create({
        email: email,
        otp: otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        attempts: 0,
        maxAttempts: 5,
      });

      // Send OTP via email
      await sendOTPEmail(email, otp, name);

      res.status(200).json({
        success: true,
        message: "OTP sent to your email. It is valid for 10 minutes.",
        email: email,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// ✅ VERIFY OTP AND CREATE USER
router.post(
"/verify-user",
  catchAsyncError(async (req, res, next) => {
    try {
      const { email, name, password, otp } = req.body;

      // Validate input
      if (!email || !name || !password || !otp) {
        return next(
          new ErrorHandler("Please provide all required fields", 400)
        );
      }

      // Find OTP record
      const otpRecord = await OTP.findOne({ email: email });

      if (!otpRecord) {
        return next(
          new ErrorHandler("OTP not found. Please request a new OTP.", 404)
        );
      }

      // Check if OTP is expired
      if (new Date() > otpRecord.expiresAt) {
        await OTP.deleteOne({ _id: otpRecord._id });
        return next(
          new ErrorHandler("OTP has expired. Please request a new OTP.", 404)
        );
      }

      // Check if max attempts exceeded
      if (otpRecord.attempts >= otpRecord.maxAttempts) {
        await OTP.deleteOne({ _id: otpRecord._id });
        return next(
          new ErrorHandler(
            "Too many failed attempts. Please request a new OTP.",
            429
          )
        );
      }

      // Verify OTP
      if (otpRecord.otp !== otp) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        const remainingAttempts = otpRecord.maxAttempts - otpRecord.attempts;
        return next(
          new ErrorHandler(
            `Invalid OTP. ${remainingAttempts} attempts remaining.`,
            400
          )
        );
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: email });
      if (existingUser) {
        return next(new ErrorHandler("User already exists", 409));
      }

      // Create user
      const user = await User.create({
        name: name,
        email: email,
        password: password,
        isVerified: true,
        avatar: {
          url: "https://via.placeholder.com/150",
        },
      });

      // Delete OTP record
      await OTP.deleteOne({ _id: otpRecord._id });

      // Send welcome email
      await sendMail({
        email: user.email,
        subject: "Welcome to E-Shop!",
        message: `<div style="font-family: Arial, sans-serif;">
          <h2>Welcome ${user.name}!</h2>
          <p>Your account has been successfully created.</p>
          <p>You can now login with your credentials.</p>
        </div>`,
      });

      // Send token
      sendToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// ✅ RESEND OTP
router.post(
"/resend-otp", 
  catchAsyncError(async (req, res, next) => {
    try {
      const { email, name } = req.body;

      if (!email || !name) {
        return next(new ErrorHandler("Please provide email and name", 400));
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: email });
      if (existingUser) {
        return next(new ErrorHandler("User already exists", 409));
      }

      // Check rate limiting - max 3 OTP requests per hour
      const recentOTPs = await OTP.find({
        email: email,
        createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
      });

      if (recentOTPs.length >= 3) {
        return next(
          new ErrorHandler(
            "Too many OTP requests. Please try again later.",
            429
          )
        );
      }

      // Generate new OTP
      const otp = generateOTP();

      // Delete any existing OTP for this email
      await OTP.deleteMany({ email: email });

      // Save new OTP to database
      await OTP.create({
  email: email,
  otp: otp,
  expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  attempts: 0,
  maxAttempts: 5, // ✅ add this
});


      // Send OTP via email
      await sendOTPEmail(email, otp, name);

      res.status(200).json({
        success: true,
        message: "New OTP sent to your email. It is valid for 10 minutes.",
        email: email,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// ✅ VERIFY OTP ONLY (without creating user - for other scenarios)
router.post(
  "/verify-otp",
  catchAsyncError(async (req, res, next) => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return next(new ErrorHandler("Please provide email and OTP", 400));
      }

      const otpRecord = await OTP.findOne({ email: email });
      if (!otpRecord) {
        return next(
          new ErrorHandler("OTP not found. Please request a new OTP.", 404)
        );
      }

      if (new Date() > otpRecord.expiresAt) {
        await OTP.deleteOne({ _id: otpRecord._id });
        return next(
          new ErrorHandler("OTP has expired. Please request a new OTP.", 404)
        );
      }

      if (otpRecord.otp !== otp) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        return next(new ErrorHandler("Invalid OTP", 400));
      }

      // Mark as verified
      otpRecord.isVerified = true;
      await otpRecord.save();

      res.status(200).json({
        success: true,
        message: "OTP verified successfully",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;
