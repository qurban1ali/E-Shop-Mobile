import { View, Text } from "react-native";
import React from "react";

export default function ShopSkelton() {
  return (
    <View
      className="w-72 bg-white rounded-2xl shadow-lg border border-gray-50 overflow-hidden mr-4 "
      style={{ width: 280 }}
    >
      {/* cover Image Skelton */}
      <View className="relative">
        <View className="w-full h-32 bg-gray-200 animate-pulse" />
        {/* Avatar skelton */}
        <View className="absolute -bottom-8 left-4">
          <View className="w-16 h-16 bg-white rounded-full p-1 shadow-lg">
            <View className="w-full h-full rounded-full bg-gray-200 animate-pulse" />
          </View>
        </View>
      </View>
      {/* Content Skelton */}
      <View className="pt-10 px-4 pb-4">
          <View className="flex-row items-center justify-between mb-2"> 
            <View className="h-5 flex-1 mr-3 rounded bg-gray-200 animate-pulse" />
            <View className="w-16  h-6 px-3 py-1 rounded-full bg-gray-200 animate-pulse" />

          </View>
      </View>
      <View className="h-4 w-3/4 mb-3 rounded bg-gray-200 animate-pulse" />
      {/* status Skelton */}
  <View className="flex-row items-center justify-between">
  <View className="flex-row items-center">
    {/* First item in the row */}
    <View className="w-3 h-3 bg-gray-200 rounded animate-pulse" />
    <View className="bg-gray-200 rounded h-3 w-8 ml-1 animate-pulse" />
  </View>

<View className="flex-row items-center">
  {/* Second row of content */}
  <View className="flex-row items-center">
    <View className="w-3 h-3 bg-gray-200 rounded animate-pulse" />
    <View className="bg-gray-200 rounded h-3 w-16 ml-1 animate-pulse" />
  </View>
</View>

<View className="flex-row items-center">
  {/* Third row of content */}
  <View className="flex-row items-center">
    <View className="w-3 h-3 bg-gray-200 rounded animate-pulse" />
    <View className="bg-gray-200 rounded h-3 w-12 ml-1 animate-pulse" />
  </View>
</View>
</View>

    </View>
  );
}
