const product = require("../model/product");
const Shop = require("../model/shop");
const ErrorHandler = require("../utils/ErrorHandler");
const express = require("express");
const catchAsyncErrors = require("../middleware/catchAsyncError");
const router = require("./product");
const Event = require("../model/event");
const { upload } = require("../multer");
const { isSeller, isAdmin, isAuthenticated } = require("../middleware/auth");
const catchAsyncError = require("../middleware/catchAsyncError");

// Create event
router.post(
  "/create-event",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { shopId, images, Start_Date, Finish_Date, ...rest } = req.body;

      // Validate shop
      const shop = await Shop.findById(shopId);
      if (!shop) {
        return next(new ErrorHandler("Shop Id is invalid!", 400));
      }

      if (!images || images.length === 0) {
        return next(
          new ErrorHandler("Please provide at least one image!", 400)
        );
      }

      if (!Start_Date || !Finish_Date) {
        return next(
          new ErrorHandler("Start_Date and Finish_Date are required!", 400)
        );
      }

      const eventData = {
        ...rest,
        images, // ✅ array of strings from frontend Cloudinary URLs
        shop,
        shopId,
        Start_Date, // match your schema
        Finish_Date, // match your schema
      };

      const event = await Event.create(eventData);

      res.status(201).json({
        success: true,
        event,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  })
);

// get all events
router.get("/get-all-events", async (req, res, next) => {
  try {
    const events = await Event.find();
    res.status(201).json({
      success: true,
      events,
    });
  } catch (error) {
    next(new ErrorHandler(error, 400));
  }
});

// get all event of a shop
router.get(
  "/get-all-events/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const events = await Event.find({ shopId: req.params.id });

      res.status(201).json({
        success: true,
        events,
      });
    } catch (error) {
      return next(new ErrorHandler(err, 400));
    }
  })
);

/// delete event of shop
router.delete(
  "/delete-shop-event/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const eventId = req.params.id;
      const event = await Event.findByIdAndDelete(eventId);

      if (!event) {
        return next(new ErrorHandler("Event not found with this id", 404));
      }

      res.status(200).json({
        success: true,
        message: "Event deleted successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// all events -- for admin
router.get(
  "/admin-all-events",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncError(async (req, res, next) => {
    try {
      const events = await Event.find().sort({
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        events,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;
