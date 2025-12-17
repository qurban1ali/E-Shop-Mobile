const express = require("express");
const ErrorHandler = require("./middleware/error");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

// Enable CORS for frontend
app.use(
  cors({
    origin: [
      "https://e-shop-tutorial-juch.vercel.app",
      "http://localhost:3000",
      "http://localhost:8082",
      "http://192.168.100.34:8082",
      "http://192.168.100.34:8082",

      // ✔️ Expo Go LAN
      "exp://192.168.100.34:19000",
      "exp://192.168.100.34:19001",
      "exp://192.168.100.34:8081",
      "exp://192.168.100.34:8082",

      // ✔️ Allow Metro Bundler local server
      "http://192.168.100.34:19000",
      "http://192.168.100.34:19001",
      "http://192.168.100.34:8081",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// app.options("*", cors());


// ✅ Serve uploads folder correctly (outside backend)
app.use("/uploads", express.static(path.join(__dirname, "./uploads")));
app.use("/test", (req, res) => {
  res.send("Hello world!");
});

// Load environment variables (non-production)
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({ path: "config/.env" });
}

// Import routes
const user = require("./controller/user");
const auth = require("./controller/auth");
const shop = require("./controller/shop");
const product = require("./controller/product");
const event = require("./controller/event");
const coupon = require("./controller/coupounCode");
const payment = require("./controller/payment");
const order = require("./controller/order");
const conversation = require("./controller/conversation");
const message = require("./controller/message");
const withdraw = require("./controller/withdraw");
const recommend = require("./controller/recommend"); // ← NO .js, NO import
const uploadRoutes = require("./controller/message");
const notification = require("./controller/notification");


// Use routes
app.use("/api/v2/auth", auth);
app.use("/api/v2/user", user);
app.use("/api/v2/message", message);
app.use("/api/v2/conversation", conversation);
app.use("/api/v2/shop", shop);
app.use("/api/v2/product", product);
app.use("/api/v2/event", event);
app.use("/api/v2/coupon", coupon);
app.use("/api/v2/payment", payment);
app.use("/api/v2/order", order);
app.use("/api/v2/withdraw", withdraw);
app.use("/api/v2/recommend", recommend);
app.use("/api/v2/notification", notification);
app.use("/upload", uploadRoutes);


// Handle favicon requests (to avoid noisy logs)
app.get("/favicon.ico", (req, res) => res.status(204).end());
app.get("/favicon.png", (req, res) => res.status(204).end());

// Catch-all for undefined API routes


// Global error handling
app.use(ErrorHandler);

module.exports = app;
       

