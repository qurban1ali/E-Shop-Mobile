import { View, Text, StatusBar, TouchableOpacity, Image } from "react-native";
import React from "react";
import { useStore } from "@/store";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView } from "react-native-gesture-handler";

export default function Wishlist() {
  const { wishlist, removeFromWishlist, addToCart } = useStore();

  const handleRemoveFromWishlist = (productId: string) => {
  removeFromWishlist(productId, null, null, "Mobile App"); // ← product.id is correct now
};

const handleAddToCart = (product: any) => {
  addToCart(
    {
      id: product.id,           // ← Now correct (we set id = _id)
      slug: product.slug,
      title: product.title,
      price: product.price,
      image: product.image,
      shopId: product.shopId,
      quantity: 1,
    },
    null,
    null,
    "Mobile App"
  );
  router.push("/(tabs)/cart");
};

  const handleProductPress = (product: any) => {
    router.push({
      //@ts-ignore
      pathname: "/(routes)/product/[id]",
      params: {
        id: product.slug,
      },
    });
  };

  if (wishlist.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        {/* header */}
        <View className="px-4 py-4 border-b border-gray-100">
          <Text className="text-2xl font-bold text-gray-900">Wishlist</Text>
          <Text className="text-sm text-gray-500 font-medium mt-1">
            Home . Wishlist
          </Text>
        </View>

        {/* Empty state */}
        <View className="flex-1 justify-center items-center px-4">
          <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-6">
            <Ionicons name="heart-outline" size={48} color="#9CA3AF" />
          </View>
          <Text className="text-xl font-bold text-gray-900 mb-2">
           {""}  Your wishlist is empty
          </Text>
          <Text className="text-gray-500 text-center font-medium mb-8">
            Start adding products to your wishlist to see them here
          </Text>
          <TouchableOpacity
            className="bg-blue-600 px-8 py-4 rounded-xl"
            onPress={() => router.push("/(tabs)")}
          >
            <Text className="text-white font-semibold text-lg ">
              {" "}
              Start Shopping
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {/* header */}
      <View className="px-4 py-4 border-b border-gray-100 ">
        <Text className="text-2xl font-bold">Wishlist</Text>
        <Text className="text-sm text-gray-500 font-medium mt-1">Home . Wishlist</Text>
      </View>

  <ScrollView  className="flex-1" showsVerticalScrollIndicator={false}>
     {/* Wishlsit Items */}
     <View className="px-4 py-6">
         {wishlist.map((product, index) => (
          <View key={product.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-4 overflow-hidden"> 
           <View className="p-4">
            <View className="flex-row">
              {/* Product Image */}
              <TouchableOpacity className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden mr-4"
              onPress={() => handleProductPress(product)}>
                   <Image source={{uri: product.image || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8c3RvcmV8ZW58MHx8MHx8fDA%3D"}} 
                   className="w-full h-full"
                   resizeMode="cover" />
              </TouchableOpacity>
              {/* Product Details */}
              <View className="flex-1">
                    <TouchableOpacity onPress={() => handleProductPress(product)}>
                         <Text className="text-lg font-semibold text-gray-900 mb-2" numberOfLines={2}>
                           {product.title}
                         </Text>
                    </TouchableOpacity>
                    {/* Price */}
                    <Text className="text-xl font-bold text-blue-600 mb-4">
                      ${product.price}
                    </Text>

                    {/* Action button */}
                    <View className="flex-row items-center justify-between"> 
                      <TouchableOpacity className="bg-blue-600 px-6 py-3 rounded-xl flex-1 mr-3"
                      onPress={() => handleAddToCart(product)}>
              <Text className="text-white font-semibold text-center"> Add to Cart</Text>
                      </TouchableOpacity>
                      <TouchableOpacity className="px-4 py-3" onPress={() => handleRemoveFromWishlist(product.id)}>
                       <View className="flex-row items-center">
                  <Ionicons name="close" size={16} color="#EF4444" />
                  <Text className="text-red-500 font-medium ml-1">Remove</Text>
                       </View>
                      </TouchableOpacity>
                    </View>
                </View>
               </View>
           </View>
          </View>
         ))}
     </View>
  </ScrollView>
    </SafeAreaView>
  );
}
