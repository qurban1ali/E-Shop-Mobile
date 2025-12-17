const express = require("express");
const router = express.Router();
const Product = require("../model/product");
const catchAsyncErrors = require("../middleware/catchAsyncError");
const Shop = require("../model/shop");
const { upload } = require("../multer");
const ErrorHandler = require("../utils/ErrorHandler");
const { isSeller, isAuthenticated, isAdmin } = require("../middleware/auth");
const Order = require("../model/order");
const catchAsyncError = require("../middleware/catchAsyncError");
const cloudinary = require("cloudinary"); // ✅ IMPORT



// Create product
router.post(
  "/create-product",
  catchAsyncErrors(async (req, res, next) => {
    const {
      shopId,
      name,
      description,
      category,
      tags,
      originalPrice,
      discountPrice,
      stock,
      images,
      sizes, // ✅ RECEIVE SIZES
    } = req.body;

    const shop = await Shop.findById(shopId);
    if (!shop) return next(new ErrorHandler("Shop Id is invalid!", 400));

    const product = await Product.create({
      name,
      description,
      category,
      tags,
      originalPrice,
      discountPrice,
      stock,
      sizes: sizes || [], // ✅ SAFE DEFAULT
      shopId,
      shop,
      images: images.map((img) =>
        typeof img === "string" ? img : img.url
      ),
    });

    res.status(201).json({
      success: true,
      product
    });
  })
);



// Get single product by ID - PUBLIC
router.get(
  "/get-product/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return next(new ErrorHandler("Product not found", 404));
      }

      res.status(200).json({
        success: true,
        product,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.get(
  "/get-filtered-products",
  catchAsyncErrors(async (req, res, next) => {
    const {
      page = 1,
      limit = 10,
      search = "",
      categories,
      colors,
      sizes,
      minPrice = 0,
      maxPrice = 999999,
    } = req.query;

    const query = {};

    // search
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    // categories
    if (categories) {
      query.category = { $in: categories.split(",") };
    }

    // sizes
    if (sizes) {
      query.availableSizes = { $in: sizes.split(",") };
    }

    // price
    query.discountPrice = {
      $gte: Number(minPrice),
      $lte: Number(maxPrice),
    };

    const skip = (page - 1) * limit;

    const products = await Product.find(query)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      products,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
      },
    });
  })
);

// GET related products by category
router.get(
  "/get-related-products/:id",
  catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product) return next(new ErrorHandler("Product not found", 404));

    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id }, // exclude the current product
    }).limit(5); // limit 5 products

    res.status(200).json({
      success: true,
      products: relatedProducts,
    });
  })
);


// Add this route if missing
router.get("/get-product-reviews", async (req, res, next) => {
  try {
    const { productId } = req.query;
    const product = await Product.findById(productId);
    res.status(200).json({
      success: true,
      reviews: product.reviews || []
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});



// get all products of a shop
router.get(
  "/get-all-products-shop/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find({ shopId: req.params.id });

      res.status(201).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// get all products
// router.get(
//   "/get-all-products",
//   catchAsyncErrors(async (req, res, next) => {
//     const {
//       // ... filters
//       page = 1,
//       limit = 10,
//       showAll, // <-- New parameter to check
//     } = req.query;

//     const query = {};
//     // ... all your filter logic ...

//     let products;
//     let total;

//     if (showAll === 'true') {
//       // 1. If showAll is true, fetch ALL products without limit/skip
//       products = await Product.find(query).populate("shop");
//       total = products.length; // Total is the length of the result
//     } else {
//       // 2. Otherwise, apply standard pagination
//       const skip = (Number(page) - 1) * Number(limit);

//       products = await Product.find(query)
//         .skip(skip)
//         .limit(Number(limit))
//         .populate("shop");

//       total = await Product.countDocuments(query);
//     }
    
//     // Send response
//     res.status(200).json({
//       success: true,
//       products,
//       pagination: {
//         page: Number(page),
//         total,
//         // Only calculate totalPages if not showing all
//         totalPages: showAll === 'true' ? 1 : Math.ceil(total / Number(limit)), 
//       },
//     });
//   })
// );

// get all products - with search, filters, and pagination
router.get(
  "/get-all-products",
  catchAsyncErrors(async (req, res, next) => {
    const {
      page = 1,
      limit = 4,
      search = "",
      categories,
      colors,
      sizes,
      minPrice = 0,
      maxPrice = 999999,
    } = req.query;

    // Build search query
    const query = {};

    // Search in product name
    if (search.trim()) {
      query.name = { $regex: search.trim(), $options: "i" };
    }

    // Category filter
    if (categories) {
      const cats = categories.split(",").filter(Boolean);
      if (cats.length > 0) query.category = { $in: cats };
    }

    // Colors filter (assuming colors stored as array of strings in product)
    if (colors) {
      const colArray = colors.split(",").filter(Boolean);
      if (colArray.length > 0) query["colors.value"] = { $in: colArray };
    }

    // Sizes filter
    if (sizes) {
      const sizeArray = sizes.split(",").filter(Boolean);
      if (sizeArray.length > 0) query.sizes = { $in: sizeArray };
    }

    // Price range
    query.discountPrice = {
      $gte: Number(minPrice),
      $lte: Number(maxPrice),
    };

    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find(query)
      .populate("shop")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  })
);


// delete product of shop
router.delete(
  "/delete-shop-product/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const productId = req.params.id;

      const product = await Product.findByIdAndDelete(productId);

      if (!product) {
        return next(new ErrorHandler("Product bot found! with this id", 500));
      }

      res.status(201).json({
        success: true,
        message: "Product Deleted successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// review for a product
router.put(
  "/create-new-review",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { rating, user, comment, productId, orderId } = req.body;

      const product = await Product.findById(productId);

      const review = {
        user,
        rating,
        comment,
        productId,
      };
      const isReviewed = product.reviews.find(
        (rev) => rev.user._id === req.user._id
      );

      if (isReviewed) {
        product.reviews.forEach((rev) => {
          if (rev.user._id === req.user._id) {
            (rev.rating = rating), (rev.comment = comment), (rev.user = user);
          }
        });
      } else {
        product.reviews.push(review);
      }

      let avg = 0;

      product.reviews.forEach((rev) => {
        avg += rev.rating;
      });
      product.ratings = avg / product.reviews.length;
      await product.save({ validateBeforeSave: false });

    await Order.findByIdAndUpdate(
  orderId,
  { $set: { "cart.$[elem].isReviewed": true } }, 
  { arrayFilters: [{ "elem._id": productId }], new: true }
);

      res.status(200).json({
        success: true,
        message: "Reviewed successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);



// all products -- for admin
router.get(
  "/admin-all-products",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncError(async (req, res, next) => {
    try {
      const products = await Product.find().sort({
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);


module.exports = router;
