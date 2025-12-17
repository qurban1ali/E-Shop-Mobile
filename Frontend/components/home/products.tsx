import { View, Text, Platform, TouchableOpacity, Image } from "react-native";
import React, { useState } from "react";
import useUser from "@/hooks/useUser";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView } from "react-native-gesture-handler";
import { useStore } from "@/store";
import { toast } from "sonner-native";

export default function ProductSection({
  title,
  products,
  showTimer = false,
  isFlashSale = false,
  hideTitle = false,
}: any) {
  const [timers, setTimers] = useState<{ [key: string]: string }>({});
  const { user } = useUser();
  const {wishlist, addToWishlist, removeFromWishlist} = useStore()

  const handleProductPress = (product: any) => {
    router.push({
      pathname:'/(routes)/product/[id]',
      params:{
        id:product._id
      }
    })
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
        id: productId,
        slug: product.slug || productId,
        title: product.name,
        price: product.discountPrice || product.originalPrice,
        image: product.images?.[0] || "",
        shopId: product.shopId || product.shop?._id,
      },
      user,
      null,
      "Mobile App"
    );
    toast.success("Added to wishlist!");
  }
};

   

   const isInWishlist = (productId:string) => {
    return wishlist.some((item) => item.id === productId)
   }

  return (
    <View className="px-4">
      {!hideTitle && (
        <View className="flex-row items-center justify-between mb-6">
          <Text
            className="text-2xl text-gray-900 "
            style={{
              fontFamily: "Inter-SemiBold",
              fontWeight: Platform.OS === "android" ? "600" : "normal",
            }}
          >
            {title}
          </Text>
          {showTimer && (
            <View className="flex-row items-center bg-gradient-to-r from-red-50 to-red-100 px-4 py-2 rounded-full shadow-sm">
              <Ionicons name="time" size={16} color="#EF4444" />
              <Text className="text-red-600 font-semibold ml-2 text-sm">
                02:30:45
              </Text>
            </View>
          )}

          <TouchableOpacity
            className="items-center bg-blue-50 px-3 py-2 rounded-full flex-row"
            //    @ts-ignore
            onPress={() => router.push("/(routes)/products")}
          >
            <Text className="text-blue-600 font-semibold mr-1 text-sm">
              See All
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#2563EB" />
          </TouchableOpacity>
        </View>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="-mx-1"
      >
        <View className="flex-row px-1">
          {products?.map((product: any, index: number) => {
            const discountPercentage =
              product?.discountPrice && product?.originalPrice
                ? Math.round(
                    ((product.originalPrice - product.discountPrice) /
                      product.originalPrice) *
                      100
                  )
                : 0;

            return (
              <View key={index} className={`${index > 0 ? "ml-4" : ""} `}>
                <TouchableOpacity
                  className="w-40 bg-white rounded-2xl shadow-lg border border-gray-50 overflow-hidden"
                  onPress={() => handleProductPress(product)}
                  activeOpacity={0.9}
                >
                  <View className="relative">
                    <Image
                      source={{ uri: product?.images?.[0] || "https://via.placeholder.com/150" }}
                      className="w-full h-36 bg-gray-100"
                      resizeMode="cover"
                    />
                    {/* Wishlist Heart icon */}
                    <TouchableOpacity
                      className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full items-center justify-center shadow-md"
                      activeOpacity={0.7}
                        onPress={(e) => handleWishlistToggle(product, e)}
                    >
                      <Ionicons
                        name={
                            isInWishlist(product._id) ? "heart" : "heart-outline"
                         }
                        size={18}
                        color={isInWishlist(product._id) ? "#EF4444" : "#6B7280"}
                      />
                    </TouchableOpacity>
                    {/* Flah sale Timer or Discount Badge */}
                    {isFlashSale ? (
                      <View className="absolute top-3 left-3 bg-red-500/95 backdrop-blur-sm px-2 py-1.5 rounded-lg shadow-lg">
                        <View className="flex-row items-center">
                          <Ionicons name="flash" size={10} color="#FFFFFF" />
                          <Text className="text-white text-xs font-bold ml-1">
                            {timers[product.id] || "00:00:00"}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      discountPercentage > 0 && (
                        <View className="absolute top-3 left-3 bg-red-500 px-2 py-1 rounded-full">
                          <Text className="text-white text-xs font-bold">
                            -{discountPercentage}%
                          </Text>
                        </View>
                      )
                    )}
                  </View>
                  <View className="p-4">
                    <View className="flex-row items-center mb-3">
                      <Image
                        source={{
                          uri:
                            product?.shop?.avatar?.url ||
                            "https://wallpapers.com/images/hd/dark-profile-pictures-1200-x-1714-3nrfdoj70fmbivxq.jpg",
                        }}
                        className="w-6 h-6 rounded-full mr-2 "
                        resizeMode="cover"
                      />

                      <View className="flex-1">
                        <Text
                          className="text-xs text-gray-600 font-medium"
                          numberOfLines={1}
                        >
                          {product.shop?.name || "Official Store"}
                        </Text>
                        <View className="flex-row items-center mt-0.5">
                          <Ionicons name="star" size={10} color="#FCD34D" />
                          <Text className="text-xs text-gray-500 ml-1 font-medium">
                            {product.shop?.ratings}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Text
                      className="text-sm font-semibold text-gray-800 mb-2 leading-5"
                      numberOfLines={2}
                    >
                      {product?.name}
                    </Text>
                    {/* Rating */}
                    <View className="flex-row items-center mb-2">
                      <View className="flex-row items-center">
                        <Ionicons name="star" size={12} color="#FCD34D" />
                        <Text className=" text-xs text-gray-600 ml-1 font-medium">
                          {product?.ratings || "4.5"}(
                          {product.reviews?.length || "3"})
                        </Text>
                      </View>
                    </View>

                    {/* Price */}
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row gap-2">
                        <Text
                          className="text-lg text-gray-900"
                          style={{
                            fontFamily: "Inter-Semibold",
                            fontWeight:
                              Platform.OS === "android" ? "600" : "normal",
                          }}
                        >
                          ${product?.originalPrice}
                        </Text>
                        <Text className="text-sm text-gray-400 line-through">
                          ${product?.discountPrice}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}

          {/* add some padding at the end */}
          <View className="w-4"/>
        </View>
      </ScrollView>
    </View>
  );
}
