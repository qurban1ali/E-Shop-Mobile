import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Image,
} from "react-native";
import React, { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/utils/axiosInstance";
// import { set } from "react-hook-form";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView } from "react-native-gesture-handler";
import useUser from "@/hooks/useUser";

interface Conversation {
  conversationId: string;
  lastMessage: string;
  lastMessageAt?: string; // optional
  updatedAt: string;
  seller: {
    id: string;
    name: string;
    avatar: string;
    isOnline: boolean;
  };
  unreadCount: number;
}

export default function Messages() {
  const { id } = useLocalSearchParams();
  const conversationId = Array.isArray(id) ? id[0] : id;
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const { user } = useUser(); 
  //@ts-ignore
  const userId = user?._id;
  // Fetch conversations
  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations", userId],
    queryFn: async () => {
      const res = await axiosInstance.get(
        `/api/v2/conversation/get-all-conversation-user/${userId}`
      );
      return res.data.conversations;
    },
  });

  // filter conversatins based on search query
  const filteredConversations =
    conversations?.filter((conversation: Conversation) => {
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();
      const sellerName = conversation.seller.name.toLowerCase();
      const lastMessage = conversation.lastMessage.toLowerCase();

      return sellerName.includes(query) || lastMessage.includes(query);
    }) || [];

  useEffect(() => {
    if (conversationId && conversations && typeof conversationId === "string") {
      const chat = conversations.find(
        (conv: Conversation) => conv.conversationId === conversationId
      );
      if (chat) {
        handleChatSelect(chat);
      }
    }
  }, [conversationId, conversations]);

  useEffect(() => {
    if (Error) {
      console.log("❌ QUERY ERROR:", Error);
    }
  }, [Error]);

  const handleChatSelect = (chat: Conversation) => {
    // Navigate to dedicated chat screen
    // @ts-ignore
    router.push(`/(routes)/chat/${chat.conversationId}`);
  };

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
    if (isSearchVisible) {
      setSearchQuery("");
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 p-12 bg-white" edges={["bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Text className="text-xl font-poppins-bold text-gray-900">
              Messages
            </Text>
          </View>

          <TouchableOpacity onPress={toggleSearch}>
            <Ionicons
              name={isSearchVisible ? "close" : "search-outline"}
              size={24}
              color="#6B7280"
            />
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        {isSearchVisible && (
          <View className="mt-4">
            <View className="flex-row items-center bg-gray-100 rounded-full px-4">
              {/* Search Icon */}
              <Ionicons
                name="search"
                size={18}
                color="#6B7280"
                style={{ marginRight: 8 }}
              />

              {/* Input */}
              <TextInput
                placeholder="Search conversations..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="flex-1 text-gray-900 font-medium"
                autoFocus
              />

              {/* Clear Button (inside input) */}
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>

      {/* content */}
      <View className="flex-1">
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <View className="animate-spin">
              <Ionicons name="refresh" size={48} color="#6B7280" />
            </View>
            <Text className="text-gray-500 font-poppins-medium mt-4 text-center">
              Loading conversations ...
            </Text>
          </View>
        ) : filteredConversations.length > 0 ? (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {filteredConversations?.map(
              (conversation: Conversation, index: number) => (
                <TouchableOpacity
                  key={conversation?.conversationId || index}
                  className="flex-row items-center p-4 border-b border-gray-100"
                  onPress={() => handleChatSelect(conversation)}
                  activeOpacity={0.7}
                >
                  <View className="relative">
                    <Image
                      source={{
                        uri: conversation?.seller?.avatar?.startsWith("http")
                          ? conversation?.seller?.avatar
                          : `https://static.vecteezy.com/system/resources/thumbnails/033/047/263/small/online-shopping-concept-e-business-e-commerce-product-booking-and-ordering-payment-via-online-bank-using-credit-cards-to-pay-product-bills-convenience-online-stores-and-shop-on-the-internet-free-photo.jpg`,
                      }}
                      className="w-12 h-12 rounded-full"
                      resizeMode="cover"
                    />
                    {conversation?.seller?.isOnline && (
                      <View className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </View>
                  <View className="flex-1 ml-3">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-gray-900 text-[19px] font-bold">
                        {conversation?.seller?.name || "Qurban"}
                      </Text>
                      <Text className="text-gray-500 font-medium text-sm">
                        {formatTimestamp(
                          conversation?.lastMessageAt || conversation?.updatedAt
                        )}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between mt-1">
                      <Text
                        className="text-gray-600 font-sm flex-1 mr-2"
                        numberOfLines={1}
                      >
                        {conversation?.lastMessage}
                      </Text>
                      {conversation.unreadCount > 0 && (
                        <View className="bg-blue-600 rounded-full w-5 h-5 items-center justify-center">
                          <Text className="text-white font-poppins-bold text-xs">
                            {conversation?.unreadCount}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              )
            )}
          </ScrollView>
        ) : searchQuery.trim() ? (
          <View className="flex-1 justify-center items-center px-4">
            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="search-outline" size={40} color="#9CA3AF" />
            </View>
            <Text className="text-gray-900 font-poppins-semibold text-xl text-center mt-2">
              No Results Found
            </Text>
            <Text className="text-gray-500 font-poppins-medium text-center">
              No conversations match &quot;{searchQuery}&quot;{" "}
            </Text>
          </View>
        ) : (
          <View className="flex-1 justify-center items-center px-4">
            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="chatbubbles-outline" size={40} color="#9CA3AF" />
            </View>
            <Text className="text-gray-900 font-poppins-semibold text-xl text-center mt-2">
              No Messages Yet
            </Text>
            <Text className="text-gray-500 font-poppins-medium text-center">
              Start a conversation with sellers to see your messages here
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
