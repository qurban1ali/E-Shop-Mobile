const Notification = require("../model/notification");

// ✅ CREATE notification helper (call from anywhere)
exports.createNotification = async ({
  type,
  title,
  message,
  receiverId,
  redirect_link,
  data,
  creatorId,
}) => {
  await Notification.create({
    type,
    title,
    message,
    receiverId,
    redirect_link,
    data,
    creatorId,
  });
};

// ✅ GET notifications for logged-in user
exports.getUserNotifications = async (req, res) => {
  const userId = req.user._id;

  const notifications = await Notification.find({ receiverId: userId })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    notifications,
  });
};

// ✅ MARK as read
exports.markNotificationAsRead = async (req, res) => {
  const { notificationId } = req.body;

  await Notification.findByIdAndUpdate(notificationId, {
    status: "Read",
  });

  res.status(200).json({
    success: true,
  });
};




const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/auth");

// GET all notifications of logged user
router.get("/my-notifications", isAuthenticated, async (req, res, next) => {
  try {
    await exports.getUserNotifications(req, res);
  } catch (err) {
    next(err);
  }
});

// MARK single notification as read
router.post("/mark-as-read", isAuthenticated, async (req, res, next) => {
  try {
    await exports.markNotificationAsRead(req, res);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
