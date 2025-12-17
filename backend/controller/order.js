const express = require("express");
const router = express.Router();
const catchAsyncError = require("../middleware/catchAsyncError");
const ErrorHandler = require("../utils/ErrorHandler");
const { isAuthenticated, isSeller, isAdmin } = require("../middleware/auth");
const Order = require("../model/order");
const Product = require("../model/product");
const Shop = require("../model/shop");

// Create new order
router.post(
  "/create-order",
  catchAsyncError(async (req, res, next) => {
    try {
      const { cart, shippingAddress, user, totalPrice, paymentInfo } = req.body;

      const shopItemsMap = new Map();
      for (const item of cart) {
        const shopId = item.shopId;
        if (!shopItemsMap.has(shopId)) {
          shopItemsMap.set(shopId, []);
        }
        shopItemsMap.get(shopId).push(item);
      }

      const orders = [];
      for (const [shopId, items] of shopItemsMap) {
        const order = await Order.create({
          cart: items,
          shippingAddress,
          user,
          shopId,
          totalPrice,
          paymentInfo,
        });
        orders.push(order);
      }

      res.status(201).json({
        success: true,
        orders,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  })
);

router.get(
  "/get-user-orders",
  isAuthenticated,
  catchAsyncError(async (req, res, next) => {
    try {
      if (!req.user) {
        // defensive: return 401 if authentication middleware did not set req.user
        console.warn("get-user-orders called without authenticated user");
        return next(new ErrorHandler("Not authenticated", 401));
      }

      const userId = req.user._id; // authenticated user id

      // console.log("get-user-orders for userId:", userId)
      // console.log("REAL CART ITEM ->", Order[0]?.cart[0]);

      // console.log("CART ITEM ->", Order.cart[0]);

      const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });

      const ordersWithProducts = await Promise.all(
        orders.map(async (order) => {
          const itemsWithProduct = await Promise.all(
            order.cart.map(async (item) => {
              const plainItem = item.toObject ? item.toObject() : item;

              const product = await Product.findById(
                plainItem.productId
              ).select(
                // Change 1: Updated selection fields
                "name images discountPrice originalPrice" // FROM: "title images sale_price regular_price"
              );

              // Change 2: New resolvedPrice logic
              const resolvedPrice =
                plainItem.price ??
                (product ? product.discountPrice ?? product.originalPrice : 0);

              return {
                // Change 3: Added plainItem.qty fallback
                quantity: plainItem.quantity ?? plainItem.qty ?? 1, // FROM: plainItem.quantity ?? 1
                discount: plainItem.discount ?? 0,
                // Change 4: Use resolvedPrice
                price: resolvedPrice, // FROM: plainItem.price ?? (product?.sale_price || product?.regular_price)
                product: product
                  ? {
                      id: product._id,
                      // Change 5: Use 'name' for 'title' and include 'name' field
                      title: product.name, // FROM: product.title
                      name: product.name, // New field for frontend compatibility
                      images: product.images || [], // FROM: product.images
                      discountPrice: product.discountPrice, // FROM: product.sale_price
                      originalPrice: product.originalPrice, // FROM: product.regular_price
                    }
                  : {
                      id: null,
                      title: "Unknown",
                      images: [],
                      discountPrice: 0, // FROM: sale_price: 0
                      originalPrice: 0, // FROM: regular_price: 0
                    },
              };
            })
          );

          return {
            ...order.toObject(),
            _id: order._id,
            items: itemsWithProduct,
            total: order.totalPrice,
            deliveryStatus: order.status || "Ordered",
          };
        })
      );

      res.status(200).json({
        success: true,
        orders: ordersWithProducts,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// ✅ GET SINGLE ORDER - TRACK ORDER
router.get(
  "/get-order-details/:id",
  isAuthenticated,
  catchAsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new ErrorHandler("Order not found", 404));
    }

    console.log("get-order-details orderId:", req.params.id);
    console.log("get-order-details order structure =>", {
      _id: order._id,
      status: order.status,
      shippingAddress: order.shippingAddress,
      cart_length: order.cart?.length,
      first_item: order.cart?.[0],
    });

    const itemsWithProducts = await Promise.all(
      order.cart.map(async (item) => {
        const plainItem = item.toObject ? item.toObject() : item;

        const product = await Product.findById(plainItem.productId).select(
          "name images discountPrice originalPrice"
        );

        const resolvedPrice =
          plainItem.price ??
          (product ? product.discountPrice ?? product.originalPrice : 0);

        return {
          _id: plainItem._id || plainItem.productId,
          productId: plainItem.productId,
          quantity: plainItem.quantity ?? plainItem.qty ?? 1,
          discount: plainItem.discount ?? 0,
          price: resolvedPrice,
          selectedOptions: plainItem.selectedOptions || {},
          product: product
            ? {
                id: product._id,
                title: product.name,
                name: product.name,
                images: product.images || [],
                discountPrice: product.discountPrice,
                originalPrice: product.originalPrice,
              }
            : null,
        };
      })
    );

    res.status(200).json({
      success: true,
      order: {
        ...order.toObject(),
        _id: order._id,
        items: itemsWithProducts,
        total: order.totalPrice,
        deliveryStatus: order.status || "Ordered",
        shippingAddress: order.shippingAddress || {},
      },
    });
  })
);

// Get all orders of user
router.get(
  "/get-all-orders/:userId",
  catchAsyncError(async (req, res, next) => {
    try {
      const orders = await Order.find();
      res.status(200).json({ success: true, orders });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Get all orders of seller
router.get(
  "/get-seller-all-orders/:shopId",
  catchAsyncError(async (req, res, next) => {
    try {
      const orders = await Order.find();
      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// UPDATE ORDER STATUS ONLY FOR SELLER
router.put(
  "/update-order-status/:id",
  isSeller,
  catchAsyncError(async (req, resp, next) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found with this id!", 400));
      }

      if (
        req.body.status === "Transferred to delivery partner" ||
        req.body.status === "Delivered"
      ) {
        for (const o of order.cart) {
          await updateOrder(o.productId, o.qty);
        }
      }

      order.status = req.body.status;
      if (req.body.status === "Delivered") {
        order.deliveredAt = Date.now();
        order.paymentInfo.status = "Succeeded";
        const serviceCharge = order.totalPrice * 0.1;
        await updateSelllerInfo(order.totalPrice - serviceCharge);
      }

      await order.save({ validateBeforeSave: false });

      resp.status(200).json({
        success: true,
        order,
      });

      async function updateOrder(id, qty) {
        if (!id) return; // skip if no id
        const product = await Product.findById(id);
        if (!product) return; // skip if product not found
        product.stock = Math.max(product.stock - qty, 0);
        product.sold_out += qty;
        await product.save({ validateBeforeSave: false });
      }
      async function updateSelllerInfo(amount) {
        const seller = await Shop.findById(req.seller.id);
        seller.availableBalance = amount;
        await seller.save();
      }
      console.log("Updating product:", o.productId, "Qty:", o.qty);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// accept the refund ----user

router.put(
  "/order-refund/:id",
  catchAsyncError(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found with this id", 400));
      }
      order.status = req.body.status;

      await order.save({ validateBeforeSave: false });

      res.status(200).json({
        success: true,
        order,
        message: "Order Refund Request successfully!",
      });
    } catch (error) {
      console.error("Backend error:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// accept the refund ---- seller

router.put(
  "/order-refund-success/:id",
  isSeller,
  catchAsyncError(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found with this id", 400));
      }
      order.status = req.body.status;

      await order.save();

      res.status(200).json({
        success: true,
        message: "Order refund Successfull!",
      });

      if (req.body.status === "Refund Success") {
        for (const o of order.cart) {
          await updateOrder(o._id, o.qty);
        }
      }

      async function updateOrder(id, qty) {
        const product = await Product.findById(id);
        if (!product) {
          throw new Error(`Product with ID ${id} not found`);
        }
        product.stock += qty;
        product.sold_out -= qty;
        await product.save({ validateBeforeSave: false });
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// all order -- for admin
router.get(
  "/admin-all-orders",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncError(async (req, res, next) => {
    try {
      const orders = await Order.find().sort({
        deliveredAt: -1,
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        orders,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;
