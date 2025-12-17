import { View, Text, Touchable, TouchableOpacity, Image } from "react-native";
import React, { useState } from "react";
import useUser from "@/hooks/useUser";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

interface Shop {
  _id: string;
  name: string;
  avatar: {
    url: string;
  };
  coverBanner?: {
    url: string;
  };
  ratings: number;
  followers: { userId: string }[];
  totalSales: number;
  category: string;
}

export default function ShopCard({
  shop,
  onPress,
}: {
  shop: Shop;
  onPress?: () => void;
}) {
  const [isFollowing, setIsFollowing] = useState(false);
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleFollowToggle = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsFollowing(!isFollowing);
      setIsLoading(false);  
    }, 300); // optional: simulate small delay
  };

  return (
    <TouchableOpacity
      className="w-72 bg-white rounded-2xl shadow-lg border border-gray-50 overflow-hidden mr-4"
      style={{ width: 280 }}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View className="relative">
        <Image
          source={{
            uri:
              shop?.coverBanner?.url &&
              "https://www.shutterstock.com/image-vector/flash-sale-banner-sparkling-neon-260nw-2481103847.jpg",
          }}
          className="w-full h-32"
          resizeMode="cover"
        />
        {/* shop avatar */}
        <View className="absolut bottom-8 left-4 ">
          <View className="w-16 h-16 bg-white rounded-full p-1 shadow-lg">
            <Image
              source={{
                uri: shop?.avatar?.url || "https://via.placeholder.com/64",
              }}
              className="w-full h-full rounded-full"
              resizeMode="cover"
            />
          </View>
        </View>
      </View>
      <View className="pt-10 px-4 pb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text
            className="text-lg font-semibold text-gray-900 flex-1 mr-3"
            numberOfLines={1}
          >
            {shop.name}
          </Text>

          <TouchableOpacity
            className={`px-3 py-1 rounded-full border ${
              isFollowing
                ? "bg-gray-50 border-gray-200"
                : "bg-blue-50 border-blue-100"
            }`}
            onPress={handleFollowToggle}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Text
              className={`font-semibold text-xs ${
                isFollowing ? "text-gray-600" : "text-blue-600"
              }`}
            >
              {isLoading ? "..." : isFollowing ? "Following" : "Follow"}
            </Text>
          </TouchableOpacity>
        </View>
        <Text className="text-sm text-gray-500 mb-3 capitalize">
          {shop.category}
        </Text>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center ">
            <Ionicons name="star" size={14} color="#FCD34D"  />
            <Text className="text-sm font-medium text-gray-700 ml-1">
              {shop.ratings}
            </Text>
          </View>
          <View className="flex-row items-center ">
            <Ionicons name="people" size={14} className="mr-1"  />
            <Text className="text-sm">
              {Array.isArray(shop.followers)
                ? shop.followers.length
                : shop.followers}
              followers
            </Text>
          </View>
          <View className="flex-row items-center ">
            <Ionicons name="cube" size={14} className="mr-1" />
            <Text className="text-sm">{shop.totalSales} Sales</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
