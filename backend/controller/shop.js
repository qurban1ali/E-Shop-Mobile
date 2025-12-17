const express = require("express");
const path = require("path");
const router = express.Router();
const fs = require("fs");
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMail");
const { isAuthenticated, isSeller, isAdmin } = require("../middleware/auth");
const sendToken = require("../utils/jwtToken");
const ErrorHandler = require("../utils/ErrorHandler");
const Shop = require("../model/shop");
const { upload } = require("../multer");
const catchAsyncError = require("../middleware/catchAsyncError");
const sendShopToken = require("../utils/shopToken");





// GET TOP SHOPS (for homepage) — FINAL FIXED VERSION
router.get("/top-shops", catchAsyncError(async (req, res, next) => {
  const shops = await Shop.find()
    .select("name avatar coverBanner ratings followers totalSales category")
    .sort({ totalSales: -1, ratings: -1 })
    .limit(10)
    .lean();

  const baseUrl = `${req.protocol}://${req.get("host")}`;

  const fixedShops = shops.map(shop => {
    // Fix avatar
    const avatarUrl = shop.avatar?.url?.startsWith("uploads")
      ? `${baseUrl}/${shop.avatar.url.replace(/\\/g, "/")}`
      : shop.avatar?.url || "https://via.placeholder.com/64";

    // Fix coverBanner — THIS IS THE KEY FIX
    let coverBannerUrl = "https://via.placeholder.com/300x120/4F46E5/ffffff?text=Shop+Banner";

    if (shop.coverBanner?.url) {
      if (shop.coverBanner.url.startsWith("uploads")) {
        coverBannerUrl = `${baseUrl}/${shop.coverBanner.url.replace(/\\/g, "/")}`;
      } else if (shop.coverBanner.url.startsWith("http")) {
        coverBannerUrl = shop.coverBanner.url;
      }
    }

    return {
  ...shop,
  ratings: shop.ratings ?? 4.5,
  followers: shop.followers ?? "89k",
  totalSales: shop.totalSales ?? 57,
  avatar: { url: avatarUrl },
  coverBanner: { url: coverBannerUrl },
};
  });

  res.status(200).json({
    success: true,
    shops: fixedShops,
  });
}));



  // FOLLOW A SHOP
router.post(
  "/follow-shop",
  isAuthenticated,
  catchAsyncError(async (req, res, next) => {
    const { shopId } = req.body;
    const userId = req.user.id;

    const shop = await Shop.findById(shopId);
    if (!shop) return next(new ErrorHandler("Shop not found", 404));

    const alreadyFollowing = shop.followers.some(
      (f) => f.userId.toString() === userId
    );

    if (alreadyFollowing) {
      return res.status(400).json({
        success: false,
        message: "Already following this shop",
      });
    }

    shop.followers.push({ userId });
    await shop.save();

    res.status(200).json({
      success: true,
      message: "Shop followed successfully",
    });
  })
);

// UNFOLLOW A SHOP
router.post(
  "/unfollow-shop",
  isAuthenticated,
  catchAsyncError(async (req, res, next) => {
    const { shopId } = req.body;
    const userId = req.user.id;

    const shop = await Shop.findById(shopId);
    if (!shop) return next(new ErrorHandler("Shop not found", 404));

    shop.followers = shop.followers.filter(
      (f) => f.userId.toString() !== userId
    );
    await shop.save();

    res.status(200).json({
      success: true,
      message: "Shop unfollowed successfully",
    });
  })
);




// CREATE SHOP
router.post("/create-shop", async (req, res, next) => {
  try {
    const { name, email, password, avatarUrl, address, phoneNumber, zipCode } = req.body;

    const shopExists = await Shop.findOne({ email });
    if (shopExists) {
      return next(new ErrorHandler("Shop already exists", 400));
    }

    const shop = {
      name,
      email,
      password,
      address,
      phoneNumber,
      zipCode,
      avatar: { url: avatarUrl || "" },
    };

    const activationToken = createActivationToken(shop);
    const activationUrl = `https://e-shop-tutorial-juch.vercel.app/seller/activation/${activationToken}`;

    await sendMail({
      email: shop.email,
      subject: "Activate your Shop",
      message: `Hello ${shop.name}, please click the link to activate your Shop: ${activationUrl}`,
    });

    res.status(201).json({
      success: true,
      message: `Please check your email (${shop.email}) to activate your Shop.`,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});



// CREATE ACTIVATION TOKEN
const createActivationToken = (seller) => {
  return jwt.sign(seller, process.env.ACTIVATION_SECRET, {
    expiresIn: "7d",
  });
};
// ACTIVATE OUR USER
router.post(
  "/activation",
  catchAsyncError(async (req, resp, next) => {
    const { activation_token } = req.body;

    const newSeller = jwt.verify(
      activation_token,
      process.env.ACTIVATION_SECRET
    );
    console.log("Decoded token:", newSeller);

    try {
      const newSeller = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET
      );
      if (!newSeller) {
        return next(new ErrorHandler("Invalid Token"));
      }
      const { name, email, password, avatar, zipCode, phoneNumber, address } =
        newSeller;
      let seller = await Shop.findOne({ email });
      if (seller) {
        return next(new ErrorHandler("user already exists", 400));
      }

      seller = await Shop.create({
        name,
        email,
        avatar,
        password,
        zipCode,
        phoneNumber,
        address,
      });
      sendShopToken(seller, 201, resp);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
    console.log("Decoded activation token:", newUser);
    console.log("Token received:", activation_token);
  })
);
// LOGIIN OUR USER
router.post(
  "/login-shop",
  catchAsyncError(async (req, resp, next) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return next(new ErrorHandler("Please provide all feilda", 400));
      }
      const shop = await Shop.findOne({ email }).select("+password");
      if (!shop) {
        return next(new ErrorHandler("Shop dosn't esists!", 400));
      }
      const isPasswordValid = await shop.comparePassword(password);
      if (!isPasswordValid) {
        return next(
          new ErrorHandler("Please provide correct information", 400)
        );
      }

      sendShopToken(shop, 201, resp);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);  

// LOAD OUT SHOP

router.get(
  "/getSeller",
  isSeller,
  catchAsyncError(async (req, resp, next) => {
    try {
      const seller = await Shop.findById(req.seller.id);

      if (!seller) {
        return next(new ErrorHandler("Shop doen't exists", 400));
      }
      resp.status(200).json({
        success: true,
        seller,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// LOGOUT METHOD

router.get(
  "/logout",
  isAuthenticated,
  catchAsyncError(async (req, resp, next) => {
    try {
      resp.cookie("seller_token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });
      resp.status(201).json({
        success: true,
        message: "Logout successfully",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// get shop info
router.get(
  "/get-shop-info/:id",
  catchAsyncError(async (req, resp, next) => {
    try {
      const shop = await Shop.findById(req.params.id);
      if (!shop) {
        return next(new ErrorHandler("Shop not found", 404));
      }
      resp.status(200).json({
        success: true,
        shop,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

//update profile picture

router.put(
  "/update-shop-avatar",
  isSeller,
  upload.single("image"),
  catchAsyncError(async (req, res, next) => {
    try {
      const existsUser = await Shop.findById(req.seller._id);

      // If old avatar exists, delete it
      if (existsUser.avatar && existsUser.avatar.url) {
        const oldPath = path.join(__dirname, "..", existsUser.avatar.url);
        try {
          fs.unlinkSync(oldPath);
          console.log("✅ Old avatar deleted:", oldPath);
        } catch (err) {
          console.warn("⚠️ Could not delete old avatar:", err.message);
        }
      }

      // Save new avatar
      const fileUrl = path.join("uploads", req.file.filename);
      existsUser.avatar = { url: fileUrl };
      await existsUser.save();

      res.status(200).json({
        success: true,
        user: existsUser,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update seller info
router.put(
  "/update-seller-info",
  isSeller,
  catchAsyncError(async (req, res, next) => {
    try {
      const { phoneNumber, name, description, address, zipCode } = req.body;
      const shop = await Shop.findOne(req.seller._id);
      if (!shop) {
        return next(new ErrorHandler("User not found", 400));
      }

      shop.name = name;
      shop.description = description;
      shop.address = address;
      shop.zipCode = zipCode;
      shop.phoneNumber = phoneNumber;

      await shop.save();

      res.status(201).json({
        success: true,
        shop,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// all sellers -- for admin
router.get(
  "/admin-all-sellers",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncError(async (req, res, next) => {
    try {
      const sellers = await Shop.find().sort({
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        sellers,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

 
// delete seller (Admin only)
router.delete(
  "/delete-seller/:id",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncError(async (req, res, next) => {
    try {
      const seller = await Shop.findById(req.params.id); // 👈 FIX: use req.params.id
      if (!seller) {
        return next(new ErrorHandler("seller not found with this id", 404));
      }

      await Shop.findByIdAndDelete(req.params.id); // 👈 delete by param id

      res.status(200).json({
        success: true,
        message: "Seller deleted successfully",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
  
);

   //update seller withdraw method -- seller

   router.put("/update-payment-methods",isSeller,catchAsyncError(async(req,res,next) => {
    try {
       const {withdrawMethod} = req.body;

       const seller = await Shop.findByIdAndUpdate(req.seller._id,{
        withdrawMethod
       })

       res.status(201).json({
        success:true,
        seller
       })
    } catch (error) {
            return next(new ErrorHandler(error.message, 500));
    }
   }))


//   delete seller withdraw method --- only seller
// delete seller withdraw method --- only seller
router.delete(
  "/delete-withdraw-method",
  isSeller,
  catchAsyncError(async (req, res, next) => {
    try {
      const seller = await Shop.findById(
        req.seller._id
      );

       if(!seller){
        return next(new ErrorHandler("Seller not found with this id", 400))
       }
      
       seller.withdrawMethod = null;
       await seller.save();

      res.status(200).json({
        success: true,
        seller,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);




module.exports = router;
