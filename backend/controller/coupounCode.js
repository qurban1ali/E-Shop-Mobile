const express = require("express");
const CouponCode = require("../model/coupounCode")
const { isSeller } = require("../middleware/auth");
const catchAsyncErrors = require("../middleware/catchAsyncError");
const ErrorHandler = require("../utils/ErrorHandler");

const router = express.Router();

// Create coupon code
router.post(
  "/create-coupon-code",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    const existingCoupon = await CouponCode.findOne({ name: req.body.name });
    if (existingCoupon) return next(new ErrorHandler("Coupon code already exists", 400));

    const couponCode = await CouponCode.create(req.body);
    res.status(201).json({ success: true, couponCode });
  })
);

// Get all coupons of a shop
router.get(
  "/get-coupon/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    const couponCodes = await CouponCode.find({ shop: req.params.id });
    res.status(200).json({ success: true, couponCodes });
  })
);

// Get coupon value by name for users
router.get(
  "/get-coupon-value/:name",
  catchAsyncErrors(async (req, res, next) => {
    const couponCode = await CouponCode.findOne({ name: req.params.name });
    if (!couponCode) return next(new ErrorHandler("Coupon not found", 404));
    res.status(200).json({ success: true, value: couponCode.value });
  })
);

module.exports = router;
