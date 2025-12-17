// controller/recommend.js
const express = require("express");
const Product = require("../model/product");

const router = express.Router();

router.get("/get-recommendation-products", async (req, res) => {
  try {
    // Step 1: Get the 20 NEWEST products first (latest created = first in array)
    const newestProducts = await Product.find()
      .sort({ createdAt: -1 })   // -1 = descending → newest first
      .limit(20);

    // Step 2: Randomly shuffle these 20 newest ones
    const shuffled = newestProducts.sort(() => 0.5 - Math.random());

    // Step 3: Take first 6 → newest products have higher chance to appear on the left!
    const selected = shuffled.slice(0, 6);

    res.json({
      success: true,
      recommendations: selected,   // ← newest ones tend to appear first
    });
  } catch (error) {
    console.error("Recommendation error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;