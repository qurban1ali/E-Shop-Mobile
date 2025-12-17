const { isSeller, isAuthenticated } = require("../middleware/auth");
const Conversation = require("../model/conversation");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const express = require("express");
const router = express.Router();
const User = require("../model/user");
const Shop = require("../model/shop");  

//create a new conversation
router.post(
  "/create-new-conversation",
  catchAsyncError(async (req, res, next) => {
    try {
      const { groupTilte, userId, sellerId } = req.body;
      const isConversationExist = await Conversation.findOne({ groupTilte });

      if (isConversationExist) {
        const conversation = isConversationExist;
        res.status(201).json({
          success: true,
          conversation,
        });
      } else {
        const conversation = await Conversation.create({
          members: [userId, sellerId],
          groupTilte: groupTilte,
        });

        res.status(201).json({
          success: true,
          conversation,
        });
      }
    } catch (error) {
      return next(new ErrorHandler(error.response.message, 400));
    }
  })
);

// get seller conversation
router.get(
  "/get-all-conversation-seller/:id",
  isSeller,
  catchAsyncError(async (req, res, next) => {
    try {
      const conversations = await Conversation.find(
        {
          members: {
            $in: [req.params.id],
          },
        }).sort({ updatedAt: -1, createdAt: -1 })
      

      res.status(201).json({
        success: true,
        conversations,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);



// get user conversation
router.get(
  "/get-all-conversation-user/:id",
  catchAsyncError(async (req, res, next) => {
    try {
      const userId = req.params.id;

      const conversations = await Conversation.find({
        members: { $in: [userId] },
      }).sort({ updatedAt: -1, createdAt: -1 });

      const formattedConversations = await Promise.all(
        conversations.map(async (conv) => {
          // get seller (shop) id - find the member that's not the current user
          const sellerId = conv.members.find((m) => m !== userId);

          // Only proceed if we found a seller ID and conversation has at least 2 members
          if (!sellerId || conv.members.length < 2) {
            return {
              conversationId: conv._id,
              lastMessage: conv.lastMessage,
              lastMessageId: conv.lastMessageId,
              lastMessageAt: conv.updatedAt,
              seller: null,
              unreadCount: 0,
              updatedAt: conv.updatedAt,
            };
          }

          const seller = await Shop.findById(sellerId).select("name avatar");

          return {
            conversationId: conv._id,
            lastMessage: conv.lastMessage,
            lastMessageId: conv.lastMessageId,
            lastMessageAt: conv.updatedAt,
            seller: seller
              ? {
                  id: seller._id,
                  name: seller.name,
                  avatar: seller.avatar?.url || null,
                  isOnline: false,
                }
              : null,
            unreadCount: 0,
            updatedAt: conv.updatedAt,
          };
        })
      );

      res.status(200).json({
        success: true,
        conversations: formattedConversations,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);



// update the last message

router.put("/update-last-message/:id", catchAsyncError(async (req,res,next) => {
  try {
    const { lastMessage, lastMessageId } = req.body;

    const conversation = await Conversation.findByIdAndUpdate(
      req.params.id,
      { lastMessageId, lastMessage },
      { new: true }
    );

    res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    return next(new ErrorHandler(error, 400));
  }
}));



module.exports = router;
