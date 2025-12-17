import { View, Text, TouchableOpacity, Image } from "react-native";
import React from "react";
import useUser from "@/hooks/useUser";
import { useStore } from "@/store";
import { router } from "expo-router";
import { toast } from "sonner-native";
import { Ionicons } from "@expo/vector-icons";

interface ProductCardProps {
  product: any;
  showActions?: boolean;
}

export default function ProductCard({
  product,
  showActions = true,
}: ProductCardProps) {
  const { user } = useUser();
  const { wishlist, addToWishlist, removeFromWishlist } = useStore();

  const handleProductPress = (product: any) => {
    router.push({
      pathname: "/(routes)/product/[id]",
      params: {
        id: product._id || product.slug,
      },
    });
  };

  const handleWishlistToggle = (product: any, e: any) => {
    e.stopPropagation();

    if (!user) {
      toast.error("Please login to add items to wishlist");
      return;
    }

    const productId = product._id;
    const isInWishlist = wishlist.some((item) => item.id === productId);

    if (isInWishlist) {
      removeFromWishlist(productId, user, null, "Mobile App");
      toast.success("Removed from wishlist");
    } else {
      addToWishlist(
        {
          id: productId, // This is correct
          slug: product.slug || productId,
          title: product.name, // Backend uses "name"
          price: product.discountPrice || product.originalPrice,
          image: product.images?.[0] || "", // images is array of strings
          shopId: product.shopId || product.shop?._id,
        },
        user,
        null,
        "Mobile App"
      );
      toast.success("Added to wishlist!");
    }
  };

  const isInWishlistFn = (productId?: string) => {
  if (!productId) return false;
  return wishlist.some((item) => item.id === productId);
};

  const discountPercentage = product.discountPrice
    ? Math.round(
        ((product.originalPrice - product.discountPrice) /
          product.originalPrice) *
          100
      )
    : 0;

  return (
    <TouchableOpacity
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      style={{ width: "48%" }}
      onPress={() => handleProductPress(product)}
      activeOpacity={0.9}
    >
      {/* Product Image */}

      <View className="relative">
        <Image
          source={{
            uri:
              product.images?.[0] ||
              "https://eduindex.org/wp-content/uploads/2021/07/green-solution.jpg",
          }}
          className="w-full h-32 bg-gray-100"
          resizeMode="cover"
        />
        {/* Action Icons */}
        {showActions && (
          <View className="absolute top-2 right-2 space-y-1">
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleWishlistToggle(product, e);
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isInWishlistFn(product._id) ? "heart" : "heart-outline"}
                size={16}
                color={isInWishlistFn(product._id) ? "#EF4444" : "#6B7280"}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Discount badge */}
        {discountPercentage > 0 && (
          <View className="absolute top-2 left-2 bg-red-500 px-1.5 py-0.5 rounded-full">
            <Text className="text-white text-xs font-bold">
              -{discountPercentage}%
            </Text>
          </View>
        )}
      </View>
      {/* Product Info */}
      <View className="p-3">
        <Text className="text-xs text-gray-500 mb-1">
          {product.shop?.name || "Shop Name"}
        </Text>

        <Text className="text-sm font-poppins-semibold text-gray-900 mb-1">
          {product.name}
        </Text>

        {/* Rating */}
        <View className="flex-row items-center mb-1">
          <Ionicons name="star" size={10} color="#FCD34D" />
          <Text className="text-xs ml-1">{product.ratings || "4.8"}</Text>
        </View>

        {/* Price */}
        <View className="flex-row items-center mb-1">
          <Text className="text-base font-poppins-bold text-blue-600">
            ${product.discountPrice || product.originalPrice}
          </Text>

          {product.discountPrice && product.originalPrice && (
            <Text className="text-xs line-through ml-1 text-gray-400">
              ${product.originalPrice}
            </Text>
          )}
        </View>

        {/* Sold */}
        <Text className="text-xs text-gray-500">
          {product.sold_out || 78} sold
        </Text>
      </View>
    </TouchableOpacity>
  );
}
