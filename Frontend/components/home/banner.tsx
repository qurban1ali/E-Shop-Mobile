import { View, Text, TouchableOpacity, Image } from "react-native";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import VectorSvg from "@/assets/svgs/vector";

export default function BigSaleBanner() {
  return (
    <View className="mx-4 my-4">
      <TouchableOpacity className="rounded-xl overflow-hidden relative shadow-lg">
        <Image
          source={{
            uri: "https://media.istockphoto.com/id/1385914712/photo/young-man-sitting-inside-of-shopping-trolley-and-holding-megaphone-isolated-on-yellow.jpg?s=612x612&w=0&k=20&c=ChgpcMdEzUWahH-V3rUskMaW1yxoBUXTxzz2M_ZnWsI=",
          }}
          className="w-full h-48"
          resizeMode="cover"
        />

        {/* Gradient overly for better text readability */}
        <LinearGradient
          colors={["rgba(0,0,0,0.3)", "transparent", "rgba(0,0,0,0.1)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="absolute inset-0"
        />
        {/* Text overlay on the left side */}
        <View className="bottom-0 justify-center px-6 w-3/5 absolute left-0 top-0">
          <Text
            className="text-gray-800  text-4xl font-bold mb-2 leading-tight"
            style={{
              textShadowColor: "rgba(255,255,255,0.8)",
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 2,
            }}
          >
            Big Sale
          </Text>

          <Text
            className="text-gray-800 text-lg font-bold mb-8 leading-tight"
            style={{
              textShadowColor: "rgba(255,255,255,0.8)",
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 2,
            }}
          >
            Up to 50%
          </Text>
          <View className="relative">
            <View className="absolute -bottom-10 -left-6">
              <VectorSvg />
            </View>
            <View className="absolute -bottom-9">
              <Text className="text-white font-bold text-sm">Happening</Text>
              <Text className="text-white font-bold text-sm">Now</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}
