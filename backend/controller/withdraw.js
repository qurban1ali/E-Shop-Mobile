const { isSeller, isAuthenticated, isAdmin } = require("../middleware/auth");
const Conversation = require("../model/conversation");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const express = require("express");
const Withdraw = require("../model/withdraw");
const sendMail = require("../utils/sendMail");
const Shop = require("../model/shop");
const router = express.Router();

// create withdraw request -- only for seller
router.post(
  "/create-withdraw-request",
  isSeller,
  catchAsyncError(async (req, res, next) => {
    try {
      const { amount } = req.body;

      const data = {
        seller: req.seller,
        amount,
      };

      // send email to seller
      await sendMail({
        email: req.seller.email, // ✅ corrected
        subject: "Withdraw Request",
        message: `Hello ${req.seller.name}, your withdraw request of ${amount}$ is processing. It will take 3 to 7 days to processing!`,
      });
      const withdraw = await Withdraw.create(data);

      const shop = await Shop.findById(req.seller._id);

      shop.availableBalance = shop.availableBalance - amount;
      await shop.save();

      return res.status(201).json({
        success: true,
        withdraw,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

//    get all withdraw --- admin
router.get(
  "/get-all-withdraw-request",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncError(async (req, res, next) => {
    try {
      const withdraws = await Withdraw.find().sort({ createdAt: -1 });

      res.status(201).json({
        success: true,
        withdraws,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update withdraw request --- admin
router.put(
  "/update-withdraw-requst/:id",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncError(async (req, res, next) => {
    try {
      const { sellerId } = req.body;
      const withdraw = await Withdraw.findByIdAndUpdate(
        req.params.id,
        {
          status: "succeed",
          updatedAt: Date.now(),
        },
        { new: true }
      );

      const seller = await Shop.findById(sellerId);
      const transection = {
        _id: withdraw._id,
        amount: withdraw.amount,
        updatedAt: withdraw.updatedAt,
        status: withdraw.status,
      };
  seller.transections.push(transection);
      await seller.save();
      try {
        await sendMail({
          email: seller.email,
          subject: "Payment confirmation",
          message: `Hello ${seller.name}, Your withdraw request of ${withdraw.amount}$ is on the way. Delivery time depends on your bank's rules it usually takes 3 days to 7 days.`
        });
      } catch (error) {
              return next(new ErrorHandler(error.message, 500));
      }
      res.status(201).json({
        success: true,
           withdraw
      })
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;
