const WebSocket = require("ws");
const Messages = require("./model/messages");
const Conversation = require("./model/conversation");
require("dotenv").config({ path: "config/.env" });

// Port for WS server (fallback 6006)
const PORT = process.env.CHATTING_WEBSOCKET_PORT || 6006;

// Simple in-memory map of userId -> ws
const clients = new Map();

const wss = new WebSocket.Server({ port: PORT }, () => {
  console.log(`✅ WebSocket server listening on ws://localhost:${PORT}`);
});

// Helper to send JSON safely
function sendJSON(ws, obj) {
  try {
    ws.send(JSON.stringify(obj));
  } catch (err) {
    console.error("Failed to send WS message", err);
  }
}

wss.on("connection", (ws) => {
  ws.isAlive = true;

  ws.on("pong", () => (ws.isAlive = true));

  ws.on("message", async (raw) => {
    let data;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      console.error("Invalid JSON from websocket client", err);
      return;
    }

    // IDENTIFY message: register userId -> ws
    if (data.type === "IDENTIFY" || data.type === "identify") {
      const userId = data.userId;
      if (userId) {
        clients.set(userId.toString(), ws);
        ws._userId = userId.toString();
        console.log(`WS: identified user ${userId}`);
      }
      return;
    }

    // MARK_AS_SEEN can be implemented as needed
    if (data.type === "MARK_AS_SEEN") {
      // optional: broadcast unseen count update or update DB
      // For now, simply acknowledge
      return;
    }

    // Chat message (frontend sometimes sends raw payload without type)
    if (data.messageBody || data.messageType) {
      try {
        const messageData = {
          conversationId: data.conversationId,
          text: data.messageBody || data.text || "",
          sender: data.fromUserId || data.sender,
          images: data.imageUrl || data.images || undefined,
        };

        const message = new Messages(messageData);
        await message.save();

        // Update conversation lastMessage
        try {
          await Conversation.findByIdAndUpdate(data.conversationId, {
            lastMessage: message.text,
            lastMessageId: message._id,
          });
        } catch (err) {
          // ignore conversation update errors
        }

        const payload = {
          type: "NEW_MESSAGE",
          payload: {
            _id: message._id,
            text: message.text,
            sender: message.sender,
            images: message.images,
            conversationId: message.conversationId,
            createdAt: message.createdAt,
          },
        };

        // Send to recipient if online
        const recipientId = (data.toUserId || data.recipientId || data.to)?.toString();
        if (recipientId) {
          const recipientWs = clients.get(recipientId);
          if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
            sendJSON(recipientWs, payload);
          }
        }

        // Echo back to sender (so UI can get saved message with _id)
        const senderId = (data.fromUserId || data.sender)?.toString();
        if (senderId) {
          const senderWs = clients.get(senderId);
          if (senderWs && senderWs.readyState === WebSocket.OPEN) {
            sendJSON(senderWs, payload);
          }
        }
      } catch (err) {
        console.error("Failed to persist or forward message", err);
      }
    }
  });

  ws.on("close", () => {
    if (ws._userId) {
      clients.delete(ws._userId);
    }
  });
});

// Ping/pong to detect dead clients
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping(() => {});
  });
}, 30000);

process.on("exit", () => clearInterval(interval));

module.exports = wss;
