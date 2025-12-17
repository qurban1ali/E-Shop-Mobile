const app = require("./app");
const connectDB = require("./db/dataBase");
const cloudinary = require("cloudinary").v2;
require("dotenv").config({ path: "config/.env" });

// ✅ Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.log(`❌ Uncaught Exception: ${err.message}`);
});

// ✅ Connect DB (once) before handling requests
(async () => {
  try {
    await connectDB();

    // 👉 If running locally, start server
    if (process.env.NODE_ENV !== "production") {
      const PORT = process.env.PORT || 8000;
      app.listen(PORT, () => {
        console.log(`✅ Server running at http://localhost:${PORT}`);
        try {
          // start the lightweight WebSocket chat server (separate port)
          require("./chat-ws-server");
        } catch (err) {
          console.warn("Could not start chat WebSocket server:", err.message);
        }
      });
    }

    // 👉 On Vercel, export the app
    module.exports = app;

    // ✅ Handle unhandled promise rejections
    process.on("unhandledRejection", (err) => {
      console.log(`❌ Unhandled Rejection: ${err.message}`);
    });
  } catch (err) {
    console.error("❌ Server startup failed:", err.message);
  }
})();
