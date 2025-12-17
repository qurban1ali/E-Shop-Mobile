// app/(tabs)/_layout.tsx
import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Tabs } from "expo-router";
import React from "react";
import { BlurView } from "expo-blur"; // ← CORRECT: Use expo-blur
import { Platform, StyleSheet, Text, View } from "react-native";
import { AntDesign, Feather } from "@expo/vector-icons";
import { useStore } from "@/store";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { wishlist, cart } = useStore();
const { totalUnread = 0 } = useUnreadMessages();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: "#8E8E93",
        tabBarButton: HapticTab,

        // ← FIXED: Must be a function returning a component
        tabBarBackground: () => (
          <BlurView
            tint={colorScheme === "dark" ? "dark" : "light"}
            intensity={80}
            style={StyleSheet.absoluteFill}
          />
        ),

        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
            backgroundColor: "transparent", // ← REQUIRED for blur to show
            borderTopWidth: 0,
          },
          android: {
            backgroundColor: Colors[colorScheme ?? "light"].background,
          },
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="wishlist"
        options={{
          title: "Wishlist",
          tabBarIcon: ({ color, size }) => (
            <View className="relative">
              <Feather name="heart" size={size} color={color} />
              {wishlist.length > 0 && (
                <View className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                  <Text className="text-white text-xs font-bold">
                    {wishlist.length > 99 ? "99+" : wishlist.length}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => (
            <View className="relative">
              <AntDesign name="message" size={size} color={color} />

              {totalUnread > 0 && (
                <View className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                  <Text className="text-white text-xs font-bold">
                    {totalUnread > 99 ? "99+" : totalUnread}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, size }) => (
            <View className="relative">
              <Feather name="shopping-bag" size={size} color={color} />
              {cart.length > 0 && (
                <View className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                  <Text className="text-white text-xs font-bold">
                    {cart.length > 99 ? "99+" : cart.length}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "profile",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
