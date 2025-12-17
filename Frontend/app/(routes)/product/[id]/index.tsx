import {
  View,
  Text,
  Dimensions,
  Image,
  StatusBar,
  TouchableOpacity,
  Share,
} from "react-native";
import React, { useState } from "react";
import {
  router,
  useGlobalSearchParams,
  useLocalSearchParams,
} from "expo-router";
import useUser from "@/hooks/useUser";
import { useStore } from "@/store";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/utils/axiosInstance";
import { toast } from "sonner-native";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();


  const { user } = useUser();
  const { wishlist, addToWishlist, removeFromWishlist, addToCart } = useStore();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const sizes = ["XS", "SM", "MD", "LG", "XL", "XXL"];
  const colors = ["Red", "Blue", "Green", "Black", "White", "Yellow"];

  // fetch prodct details
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {

      const response = await axiosInstance.get(
        `/api/v2/product/get-product/${id}`
      );
      return response.data.product;
    },
  });

  // Fetch related products
  const { data: relatedProducts, isLoading: relatedLoading } = useQuery({
    queryKey: ["related-products", id],
    queryFn: async () => {
      try {
        // Build query string manually since URLSearchParams isn't available (in all RN environments)
        const queryParams = [
          "priceRange=0,1000", // Default price range
          "page=1",
          "limit=5",
        ].join("&");

        const response = await axiosInstance.get(
          `/api/v2/product/get-related-products/${id}`
        );

        return response.data.products || [];
      } catch (error) {
        console.error("Failed to fetching related products:", error);
        return [];
      }
    },
    enabled: !!product,
  });

  // Fetch product reviews
  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ["product-reviews", id],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/api/v2/product/get-product-reviews?productId=${id}`
      );

      return response.data.reviews || [];
    },
    enabled: !!product,
  });
  // check if product is in wishlist
  // THIS IS THE KEY: Compute isWishlisted EVERY TIME wishlist or product changes
  const isWishlisted = React.useMemo(() => {
    if (!product?._id) return false;
    return wishlist.some((item) => item.id === product._id);
  }, [wishlist, product?._id]);

  // Handle wishlist toggle
  const handleWishlistToggle = () => {
    if (!user) {
      toast.error("Please login to add items to wishlist");
      return;
    }
    if (!product) return;

    const isWishlisted = wishlist.some((item) => item.id === product._id);

    if (isWishlisted) {
      removeFromWishlist(product._id, user, null, "Mobile App");
      toast.success("Removed from wishlist");
    } else {
      addToWishlist(
        {
          id: product._id, // ← Correct
          slug: product.slug || product._id,
          title: product.name, // ← Use "name"
          price: product.discountPrice || product.originalPrice, // ← Correct fields
          image: product.images?.[0] || "", // ← String, not object
          shopId: product.shopId,
        },
        user,
        null,
        "Mobile App"
      );
      toast.success("Added to wishlist!");
    }
  };

  //   Handle add to cart
  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Please login to add items to cart");
      return;
    }

    if (!product) return;

    addToCart(
      {
        id: product._id,
        slug: product.slug || product._id,
        title: product.name, // ← name, not title
        price: product.discountPrice || product.originalPrice,
        image: product.images?.[0] || "", // ← string
        shopId: product.shopId,
        quantity,
      },
      user,
      null,
      "Mobile App"
    );

    router.push("/(tabs)/cart");
  };

  //   Handle buy now
  const handleBuyNow = async () => {
    if (!user) {
      toast.error("Please login to add items to purchase");
      return;
    }

    if (!product) return;
    // add to cart
    addToCart(
      {
        id: product._id,
        slug: product.slug || product._id,
        title: product.name, // ← name, not title
        price: product.discountPrice || product.originalPrice,
        image: product.images?.[0] || "",
        shopId: product.shopId,
        quantity,
      },
      user,
      null,
      "Mobile App"
    );

    router.push("/(tabs)/cart");
  };

  const renderImageGallery = () => {
    if (!product?.images || product?.images?.length === 0) {
      return (
        <View className="mb-6">
          <View className="relative">
            <Image
              source={{
                uri: "https://d30fs77zq6vq2v.cloudfront.net/shares/20250908/mobile_1757316960.png",
              }}
              style={{ width, height: width }}
              className="bg-gray-100"
              resizeMode="cover"
            />
          </View>
        </View>
      );
    }

    return (
      <View className="mb-6">
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setSelectedImageIndex(index);
          }}
        >
          {product?.images?.map((image: any, index: number) => (
            <View key={index} className="relative">
              <Image
                source={{ uri: image?.url || image }}
                style={{ width, height: width }}
                className="bg-gray-100"
                resizeMode="cover"
              />
              {/* Discount Badge */}
              {index === 0 && product.discountPrice && (
                <View className="absolute top-4 left-4 bg-red-500 px-3 py-1.5 rounded-full shadow-lg">
                  <Text className="text-white text-sm font-bold">
                    -
                    {Math.round(
                      ((product.originalPrice - product.discountPrice) /
                        product.originalPrice) *
                        100
                    )}
                    %
                  </Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
        {/* Image Indicators */}
        <View className="flex-row justify-center mt-4">
          {product?.images?.map((_: any, index: number) => (
            <View
              key={index}
              className={`w-2 h-2 rounded-full mx-1 ${
                index === selectedImageIndex ? "bg-blue-600" : "bg-gray-400"
              }`}
            />
          ))}
        </View>
      </View>
    );
  };

  const renderProductInfo = () => {
    return (
      <View className="px-4 mb-6">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-2xl font-semibold text-gray-900 flex-1">
            {product?.name || "Loading..."}
          </Text>
          <TouchableOpacity
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
            onPress={handleWishlistToggle}
          >
            <Ionicons
              name={isWishlisted ? "heart" : "heart-outline"}
              size={24}
              color={isWishlisted ? "#EF4444" : "#6B7280"}
            />
          </TouchableOpacity>
        </View>

        {/* Ratings and sales  */}
        <View className="flex-row items-center mb-4">
          <View className="flex-row items-center mr-4">
            <Ionicons name="star" size={16} color="#FCD34D" />
            <Text className="text-gray-700 ml-1 font-medium">
              {product?.ratings || 4.5} ({product?.reviews?.length || 0}{" "}
              reviews)
            </Text>
          </View>

          <Text className="text-gray-500">
            • {product?.sold_out || 189} sold
          </Text>
        </View>

        {/* Price */}
        <View className="flex-row items-center mb-6">
          <Text className="text-3xl font-poppins-semibold text-gray-900 mr-2">
            ${product?.discountPrice || product?.originalPrice || "0"}
          </Text>
          {product?.discountPrice && product?.originalPrice && (
            <Text className="text-lg text-gray-400 line-through">
              ${product.originalPrice}
            </Text>
          )}
        </View>

        {/* Shop Info */}
       {product?.shop && (
  <TouchableOpacity
    className="flex-row items-center bg-gray-50 p-4 rounded-xl mb-6"
    onPress={() =>
      router.push({
        pathname: "/(routes)/shop/[id]",
        params: {
          id: product.shop._id,
        },
      })
    }
  >
    <Image
      source={{ uri: product.shop.avatar?.url || "" }}
      className="w-12 h-12 rounded-full mr-3"
    />

    <View className="flex-1">
      <View className="flex-row items-center">
        <Text className="text-lg font-medium text-gray-900">
          {product.shop.name}
        </Text>
      </View>
      <View className="flex-row items-center mt-1">
        <Ionicons name="star" size={12} color="#FCD34D" />
        <Text className="text-sm text-gray-600 ml-1">
          {product.shop.ratings || 0} • {product.shop.followers?.length || 0} Followers
        </Text>
      </View>
    </View>

    <Ionicons name="chevron-forward" size={20} color="#6B7280" />
  </TouchableOpacity>
)}

      </View>
    );
  };

  const renderVariantSelector = () => {
    if (!product) return null;
    return (
      <View className="px-4 mb-6">
        {/* Size Selector */}
<View className="mb-4">
  <Text className="text-lg font-poppins-medium text-gray-900 mb-3">
    Size
  </Text>
  <View className="flex-row flex-wrap">
    {sizes.map((size: string) => (
      <TouchableOpacity
        key={size}
        onPress={() => setSelectedSize(size)}
        className={`mr-3 mb-2 px-4 py-2 rounded-lg border ${
          selectedSize === size
            ? "bg-blue-600 border-blue-600"
            : "bg-white border-gray-300"
        }`}
      >
        <Text
          className={`font-medium ${
            selectedSize === size ? "text-white" : "text-gray-800"
          }`}
        >
          {size}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
</View>



        {/* Color Selector */}
        {product?.colors && product?.colors?.length > 0 && (
          <View className="mb-4">
            <Text className="text-lg font-poppins-medium text-gray-900 mb-2">
              Color
            </Text>
            <View className="flex-row flex-wrap">
              {product?.colors?.map((color: string) => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setSelectedColor(color)}
                  className={`mr-3 mb-2 w-12 h-12 rounded-full border-2 items-center justify-center ${
                    selectedColor === color
                      ? "border-blue-600"
                      : "border-gray-300"
                  }`}
                  style={{
                    backgroundColor: color.toLocaleLowerCase(),
                  }}
                >
                  {selectedColor === color && (
                    <View className="w-6 h-6 bg-white rounded-full items-center justify-center">
                      <Ionicons name="checkmark" size={16} color="#2563EB" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Quantity Selector */}
        <View>
          <Text className="text-lg font-poppins-medium text-gray-900 mb-3">
            Quantity
          </Text>
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => quantity > 1 && setQuantity(quantity - 1)}
              className="w-10 h-10 bg-gray-100 rounded-lg items-center justify-center"
            >
              <Ionicons name="remove" size={20} color="#6B7280" />
            </TouchableOpacity>
            <Text className="mx-4 text-lg font-medium text-gray-900">
              {quantity}
            </Text>
            <TouchableOpacity
              onPress={() => setQuantity(quantity + 1)}
              className="w-10 h-10 bg-gray-100 rounded-lg items-center justify-center"
            >
              <Ionicons name="add" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderTabs = () => (
    <View className="px-4 mb-6">
      {/* Tab Headers */}
      <View className="flex-row bg-gray-100 rounded-xl p-1 mb-4">
        {["description", "specifications", "reviews"]?.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`flex-1 py-3 rounded-lg ${
              activeTab === tab ? "bg-white" : ""
            }`}
          >
            <Text
              className={`text-center font-medium capitalize ${
                activeTab === tab ? "text-blue-600" : "text-gray-600"
              }`}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "description" && (
        <View>
          {product?.description ? (
            <View className="bg-gray-50 p-4 rounded-xl">
              <Text className="text-gray-700 leading-6">
                {product.description?.replace(/<[^>]*>/g, "") ||
                  "No description available"}
              </Text>
            </View>
          ) : (
            <Text className="text-gray-700 leading-6">
              No description available
            </Text>
          )}
        </View>
      )}

      {activeTab === "specifications" && (
        <View>
          <View className="space-y-4">
            {/* Sizes */}
            <View className="bg-gray-50 p-4 rounded-xl">
              <Text className="text-lg font-medium text-gray-900 mb-3">
                Available Sizes
              </Text>

              <View className="flex-row flex-wrap mt-3 gap-2">
                {sizes?.map((size: string) => (
                  <View
                    key={size}
                    className="bg-white px-3 py-2 rounded-lg mr-2 mb-2 border border-gray-300"
                  >
                    <Text className="text-gray-700 font-medium">{size}</Text>
                  </View>
                ))}
              </View>
            </View>
            {/* Colors */}
            <View className="bg-gray-50 p-4 rounded-xl">
              <Text className="text-lg font-poppins-medium text-gray-900 mb-3">
                Available Colors
              </Text>

              <View className="flex-row flex-wrap">
                {colors?.map((color: string) => (
                  <View key={color} className="flex-row items-center mr-3 mb-3">
                    <View
                      className="w-6 h-6 rounded-full mr-2 border border-gray-300"
                      style={{ backgroundColor: color.toLowerCase() }}
                    />
                    <Text className="text-gray-700 font-medium capitalize">
                      {color}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Custom Specifications */}
            {product?.custom_specifications &&
              Object.keys(product.custom_specifications)?.length > 0 && (
                <View className="bg-gray-50 p-4 rounded-xl">
                  <Text className="text-lg font-poppins-medium text-gray-900 mb-3">
                    Product Specifications
                  </Text>
                  <View className="space-y-2">
                    {Object.entries(product.custom_specifications)?.map(
                      ([key, value]) => (
                        <View
                          key={key}
                          className="flex-row justify-between py-2 border-b border-gray-200"
                        >
                          <Text className="text-gray-600 font-medium capitalize">
                            {key.replace(/_/g, " ")}
                          </Text>
                          <Text className="text-gray-900 text-right flex-1 ml-4">
                            {value as string}
                          </Text>
                        </View>
                      )
                    )}
                  </View>
                </View>
              )}

            {/* Show message if no specification availabe */}
            {!sizes && !colors && (
              <View className="items-center py-8">
                <Text className="text-gray-700">
                  No specifications available
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {activeTab === "reviews" && (
        <View className="space-y-4">
          {product?.reviews?.length === 0 ? (
            <Text className="text-gray-700">No reviews available</Text>
          ) : (
            product?.reviews?.map((review: any) => (
              <View key={review.id} className="bg-gray-50 p-4 rounded-xl">
                <View className="flex-row items-center mb-3">
                  <Image
                    source={{
                      uri:
                        review.user?.avatar ||
                        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSrn_80I-lMAa0pVBNmFmQ7VI6l4rr74JW-eQ&s",
                    }}
                    className="w-10 h-10 rounded-full mr-3 border border-gray-200"
                    resizeMode="cover"
                  />
                  <View className="flex-1">
                    <Text className="text-md font-medium text-gray-900">
                      {review.user?.name || "Anonymous"}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <Ionicons name="star" size={12} color="#fcd34d" />
                      <Text className="text-sm text-gray-600 ml-1">
                        {review.rating || "4.5"}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text className="text-gray-700 leading-6">
                  {review.comment || "No comment provided"}
                </Text>
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );

  const renderRelatedProducts = () => {
    if (relatedProducts?.length === 0)
      return (
        <View className="px-4 mb-6">
          <Text className="text-lg font-medium text-gray-900 mb-4">
            Related Products :
          </Text>
          <Text className="mx-auto font-medium text-gray-700 mb-4">
            No related products found
          </Text>
        </View>
      );
    return (
      <View className="px-4 mb-6">
        <Text className="text-lg font-medium text-gray-900 mb-4">
          Related Products
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {relatedProducts?.map((prod: any) => (
            <TouchableOpacity
              key={prod.id}
              onPress={() => router.push(`/(routes)/product/${prod._id}`)}
              className="w-40 mr-4 border border-gray-100 rounded-2xl"
            >
              <Image
                source={{
                  uri:
                    prod.images?.[0] ||
                    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSrn_80I-lMAa0pVBNmFmQ7VI6l4rr74JW-eQ&s",
                }}
                className="w-full h-40 bg-gray-100 rounded-xl mb-2"
                resizeMode="contain"
              />
              <Text
                className="font-[600] mx-auto text-gray-900 mt-1"
                numberOfLines={2}
              >
                {prod.name}
              </Text>
              <View className="flex-row justify-between px-3 mt-2">
                <Text className="text-lg font-semibold text-gray-900">
                  ${prod.discountPrice.toFixed(0)}
                </Text>
                <View className="flex-row items-center gap-1">
                  <Ionicons name="star" size={12} color="#fcd34d" />
                  <Text className="font-semibold text-gray-900">
                    {prod.ratings || "0"}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const handleShare = async (product: any) => {
    try {
      const shareOptions = {
        title: `Check out this amazing product: ${product.name}`,
        message: `🛍️ ${product.name}\n\n💰 Price: $${
          product.discountPrice || product.originalPrice
        }${
          product.discountPrice && product.originalPrice
            ? ` (was $${product.originalPrice})`
            : ""
        }
\n⭐ Rating: ${product.rating || 4.5}/5 (${
          product?.reviews?.length || 0
        } reviews)\n\nShop: ${product.shop?.name || "Official Store"}\n\n${
          product.description || "Amazing product!"
        }
\n\nGet it now! 🔥`,
        url: `https//yourapp.com/product/${product.id}`,
      };

      const result = await Share.share(shareOptions);

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log("Shared Via", result.activityType);
        } else {
          console.log("Product shared Successfully");
        }
      } else if (result.action === Share.dismissedAction) {
        console.log("Share dialoged dismissed");
      }
    } catch (error) {
      console.log(`Error sharing product: ${error}`);
    }
  };

  // Loading state
  if (productLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View className="flex-1 justify-center items-center">
          <View className="w-16 h-16 bg-blue-600 rounded-full items-center justify-center">
            <Ionicons name="cube" size={32} color="white" />
          </View>
          <Text className="text-gray-600 font-poppins-medium mt-4">
            Loading product details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state

  if (!product) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View className="flex-1 justify-center items-center px-4">
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
          <Text className="text-gray-900 font-poppins-bold text-xl mt-4">
            Product Not Found
          </Text>
          <Text className="text-gray-500 text-center mt-2">
            The product you are looking for does not exist or has been removed.
          </Text>
          <TouchableOpacity
            className="mt-6 bg-blue-600 px-6 py-3 rounded-xl"
            onPress={() => router.back()}
          >
            <Text className="text-white font-poppins-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle={"dark-content"} backgroundColor="#fff" />
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
        >
          <Ionicons name="arrow-back" size={20} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-poppins-medium text-gray-900">
          Product Details
        </Text>
        <TouchableOpacity
          onPress={() => handleShare(product)}
          className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
        >
          <Ionicons name="share-outline" size={20} color="#374151" />
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {renderImageGallery()}
        {renderProductInfo()}
        {renderVariantSelector()}
        {renderTabs()}
        {renderRelatedProducts()}

        <View className="h-20" />
      </ScrollView>
      {/* Bottom action bar */}
      <View className="flex-row items-center justify-between px-4 py-3 border-t border-gray-100 bg-white">
        <TouchableOpacity
          className="flex-1 bg-blue-100 py-4 rounded-xl mr-3"
          onPress={handleAddToCart}
        >
          <Text className="text-center text-blue-600 font-semibold">
            Add to Cart
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-blue-600 py-4 rounded-xl"
          onPress={handleBuyNow}
        >
          <Text className="text-center text-white font-semibold">Buy Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
