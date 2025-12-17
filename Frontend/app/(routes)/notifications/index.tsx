import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/utils/axiosInstance";
import { router } from "expo-router";
import { toast } from "sonner-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "react-native";

type NotificationType = "orders" | "promotions" | "system" | "chat" | "all";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  status: "Read" | "Unread";
  createdAt: string;
  updatedAt: string;
  receiverId: string;
  creatorId: string;
  redirect_link?: string;
  data?: any;
}

export default function NotificationsScreen() {
  const [selectedType, setSelectedType] = useState<NotificationType>("all");
  const queryClient = useQueryClient();

  const staticNotifications: Notification[] = Array.from({ length: 10 }).map(
    (_, idx) => {
      const now = Date.now();
      return {
        id: `static-${idx + 1}`,
        type: (["orders", "promotions", "system", "chat"] as NotificationType[])[
          idx % 4
        ],
        title: ["Order placed", "Promo alert", "System update", "New message"][
          idx % 4
        ],
        message: [
          "Your order has been received and is being processed.",
          "Get 15% off on selected items this week.",
          "We’ve improved performance and fixed minor bugs.",
          "You have a new message from Support.",
        ][idx % 4],
        status: idx < 3 ? "Unread" : "Read",
        createdAt: new Date(now - idx * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now - idx * 60 * 60 * 1000).toISOString(),
        receiverId: "demo-user",
        creatorId: "system",
      };
    }
  );

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await axiosInstance.get(
        "/api/v2/notification/my-notifications"
      );
      return res.data.notifications;
    },
  });

  const notifications: Notification[] =
    notificationsData && notificationsData.length > 0
      ? notificationsData
      : staticNotifications;

  const markAsRead = async (notificationId: string) => {
    try {
      await axiosInstance.post("/api/v2/notification/mark-as-read", {
        notificationId,
      });

      // Refetch notifications to update the read status
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      // Don't show error toast to user as this is a background operation
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "orders":
        return { name: "bag-outline", color: "#2563EB", bg: "#DBEAFE" };
      case "promotions":
        return { name: "gift-outline", color: "#D97706", bg: "#FEF3C7" };
      case "chat":
        return { name: "chatbubble-outline", color: "#059669", bg: "#D1FAE5" };
      case "system":
        return { name: "settings-outline", color: "#6B7280", bg: "#F3F4F6" };
      default:
        return {
          name: "notifications-outline",
          color: "#6B7280",
          bg: "#F3F4F6",
        };
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const notificationDate = new Date(timestamp);
    const diffInMs = now.getTime() - notificationDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 10) {
      return "Just now";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} hour${diffInDays > 1 ? "s" : ""} ago`;
    } else {
      return notificationDate.toLocaleDateString("en-GB", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const getActionText = (notification: Notification) => {
    if (notification.type === "orders" && notification.redirect_link) {
      return "View Order";
    } else if (notification.type === "promotions") {
      return "Shop Now";
    } else if (notification.type === "chat") {
      return "Reply";
    } else if (notification.type === "system") {
      return "View Details";
    }
    return null;
  };

  const handleNotificationAction = async (notification: Notification) => {
    // Mark as read if notification is unread
    if (notification.status === "Unread") {
      await markAsRead(notification.id);
    }

    // Handle navigation
    if (notification.type === "orders" && notification.redirect_link) {
      // Extract order ID from redirect link
      const orderId = notification.redirect_link.split("/").pop();
      if (orderId) {
        router.push({
          pathname: "/(routes)/order-details/[id]",
          params: { id: orderId },
        });
      }
    } else if (notification.type === "promotions") {
      router.push("/(routes)/products");
    } else if (notification.type === "chat") {
      router.push("/(tabs)/messages");
    } else if (notification.type === "system") {
      router.push("/(tabs)/profile");
    }
  };
  const handleMarkAllAsRead = async () => {
    try {
      // Mark all unread notifications as read
      const unreadNotifications = notifications.filter(
        (n) => n.status === "Unread"
      );

      await Promise.all(
        unreadNotifications.map((notification) => markAsRead(notification.id))
      );

      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to mark notifications as read");
    }
  };

  const filteredNotifications =
    selectedType === "all"
      ? notifications
      : notifications.filter(
          (notification) => notification.type === selectedType
        );

  const unreadCount = notifications.filter((n) => n.status === "Unread").length;

  const renderNotificationCard = (notification: Notification) => {
    const iconConfig = getNotificationIcon(notification.type);
    const isUnread = notification.status === "Unread";
    const actionText = getActionText(notification);


    return (
      <TouchableOpacity
        key={notification.id}
        className={`bg-white rounded-2xl shadow-[0_1px_rgba(0,0,0,0.1)] border border-gray-100 mb-4 p-4 ${
          isUnread ? "border-l-4 border-l-blue-500" : ""
        }
      `}
        activeOpacity={0.7}
        onPress={() => handleNotificationAction(notification)}
      >
        <View className="flex-row">
          {/* Icon */}
          <View
            className="w-12 h-12 rounded-xl items-center justify-center mr-4"
            style={{ backgroundColor: iconConfig.bg }}
          >
            <Ionicons
              name={iconConfig.name as any}
              size={24}
              color={iconConfig.color}
            />
          </View>

          {/* Content */}
          <View className="flex-1">
            <View className="flex-row items-start justify-between mb-2">
              <Text
                className={`font-semibold flex-1 mr-2 ${
                  isUnread ? "text-gray-900" : "text-gray-600"
                }`}
              >
                {notification.title}
              </Text>
              <Text className="text-gray-500 font-medium text">
                {formatTimestamp(notification.createdAt)}
              </Text>
            </View>

            <Text
              className={`font-medium mb-3 ${
                isUnread ? "text-gray-800" : "text-gray-600"
              }`}
            >
              {notification.message}
            </Text>
            {/* Action Button */}
            {actionText && (
              <TouchableOpacity
                className="bg-blue-600 px-4 py-2 rounded-lg self-start"
                onPress={() => handleNotificationAction(notification)}
              >
                <Text className="text-white font-semibold text-sm">
                  {actionText}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* unread Indicator */}
          {isUnread && (
            <View className="w-3 h-3 bg-blue-600 rounded-full ml-2" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const filterTypes = [
    { key: "all", label: "All" },
    { key: "orders", label: "Orders" },
    { key: "chat", label: "Chat" },
    { key: "system", label: "System" },
    { key: "promotions", label: "Promotions" },
  ];


  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 pt-12 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-900">
              Notifications
            </Text>
          </View>
          <View className="flex-row items-center">
            {/* {unreadCount > 0 && ( */}
              <View className="bg-blue-600 rounded-full w-6 h-6 items-center justify-center mr-3">
                <Text className="text-white font-bold text-xs">
                  {unreadCount}
                </Text>
              </View>
            {/* )} */}
          </View>
          {/* The line below was partially visible */}
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Ionicons name="checkmark-done-outline" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row"
        >
          {filterTypes.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              className={`px-4 py-2 rounded-full mr-3 ${
                selectedType === filter.key ? "bg-blue-600" : "bg-gray-100"
              }`}
              onPress={() => setSelectedType(filter.key as NotificationType)}
            >
              <Text
                className={`font-medium text-sm ${
                  selectedType === filter.key ? "text-white" : "text-gray-700"
                }`}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Notifications List */}
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View className="flex-1 justify-center items-center py-20">
            <View className="animate-spin">
              <Ionicons name="refresh" size={48} color="#6B7280" />
            </View>
            <Text className="text-gray-500 font-medium mt-4 text-center text-lg">
              Loading notifications ...
            </Text>
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="notifications-outline" size={64} color="#9CA3AF" />
            <Text className="text-gray-500 font-medium mt-4 text-center">
              No notifications
            </Text>
            <Text className="text-gray-400 font-medium text-center m">
              {selectedType === "all"
                ? "You're all caught up!"
                : `No ${selectedType} notifications`}
            </Text>
          </View>
        ) : (
          filteredNotifications.map(renderNotificationCard)
        )}
        {/* bottom spacing */}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
