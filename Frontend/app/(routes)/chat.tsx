import {
  View,
  Text,
  ScrollView,
  TextInput,
  StatusBar,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import useUser from "@/hooks/useUser";
import { QueryClient, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/context/web-socket.context";
import { useConversation } from "@/context/conversation.context";
import axiosInstance from "@/utils/axiosInstance";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { toast } from "sonner-native";
import EmojiPicker from "rn-emoji-selector";
import { emojis } from "rn-emoji-selector/dist/data";

interface ChatMessage {
  id: string;
  content: string;
  senderType: "user" | "seller";
  seen: boolean;
  createdAt: string;
  time?: string;
  imageUrl?: string;
  messageType?: "text" | "image";
}
interface Conversation {
  conversationId: string;
  lastMessage: string;
  lastMessageAt: string;
  seller: {
    id: string;
    name: string;
    avatar: string;
    isOnline: boolean;
  };
  unreadCount: number;
}

export default function ChatDetails() {
  const { id } = useLocalSearchParams();
  const conversationId = Array.isArray(id) ? id[0] : id;
  const { user } = useUser();
  const queryClient = useQueryClient();
  const scrollViewRef = useRef<ScrollView>(null);
  const messageInputRef = useRef<TextInput>(null);
  const { ws } = useWebSocket();
  const { setSelectedConversationId } = useConversation();

  const [messageText, setMessageText] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recentEmojis, setRecentEmojis] = useState<any[]>([]);
  //@ts-ignore
  const userId = String(user?._id || user?.id || "");

  // Fetch conversation to get the current chat Details
  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations", userId],
    queryFn: async () => {
      const res = await axiosInstance.get(
        `/api/v2/conversation/get-all-conversation-user/${userId}`
      );
      return res.data.conversations;
    },
  });

  // Get current
  const currentConversation = conversations?.find(
    (conv: Conversation) => conv.conversationId === conversationId
  );

  // Fetch messages
  const { data: messages = [] } = useQuery({
    queryKey: ["messages", conversationId, userId],
    enabled: !!conversationId && !!userId,
    queryFn: async () => {
      if (!conversationId || hasFetchedOnce) return [];

      const res = await axiosInstance.get(
        `/api/v2/message/get-all-messages/${conversationId}?page=1`
      );

      const mapped = res.data.messages.reverse().map((msg: any) => ({
        id: msg._id,
        content: msg.text,
        senderType: String(msg.sender) === String(userId) ? "user" : "seller",
        seen: false,
        createdAt: msg.createdAt,
        imageUrl: msg.images,
        messageType: msg.images ? "image" : "text",
      }));

      return mapped;
    },
  });

  // Set selected conversation in context
  useEffect(() => {
    if (conversationId && typeof conversationId === "string") {
      setSelectedConversationId(conversationId);
    }
  }, [conversationId, setSelectedConversationId]);

  useEffect(() => {
    if (conversationId && userId) {
      queryClient.invalidateQueries({
        queryKey: ["messages", conversationId, userId],
      });
    }
  }, [conversationId, userId]);

  // Websocket message handling
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "NEW_MESSAGE") {
          const payload = data.payload;

          if (!userId || !payload?.sender) return;

          if (payload.conversationId === conversationId) {
            const newMessageObj = {
              id: payload._id || Date.now().toString(),
              content: payload.text || payload.messageBody || "",
              senderType:
                String(payload.sender) === String(userId) ? "user" : "seller",
              seen: false,
              createdAt: payload.createdAt,
              imageUrl: payload.images,
              messageType: payload.images ? "image" : "text",
            };

            queryClient.setQueryData(
              ["messages", conversationId, userId],
              (old: any[] = []) => [...old, newMessageObj]
            );

            scrollToBottom();
          }

          // Update conversation list preview using the payload
          try {
            queryClient.setQueryData(
              ["conversations", userId],
              (old: any[] = []) =>
                old.map((conv: any) =>
                  conv.conversationId === payload.conversationId
                    ? {
                        ...conv,
                        lastMessage: payload.text || payload.messageBody || "",
                        lastMessageAt: new Date().toISOString(),
                      }
                    : conv
                )
            );
          } catch (err) {
            console.warn("Failed to update conversations cache", err);
          }

          setMessageText("");
        } else if (data.type === "UNSEEN_COUNT_UPDATE") {
          const { conversationId: convId, count } = data.payload;
          queryClient.setQueryData(
            ["conversations"],
            (old: Conversation[] = []) =>
              old.map((conv) =>
                conv.conversationId === convId
                  ? { ...conv, unreadCount: count }
                  : conv
              )
          );
        }
      } catch (error) {
        console.error("WebSocket message parsing error:", error);
      }
    };

    ws.addEventListener("message", handleMessage);

    return () => {
      try {
        ws.removeEventListener("message", handleMessage);
      } catch (err) {
        /* ignore */
      }
    };
  }, [ws, conversationId, queryClient, userId]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // Mark conversation as seen when entering
  useEffect(() => {
    if (conversationId && currentConversation) {
      // Mark as seen
      queryClient.setQueryData(["conversations"], (old: any = []) =>
        old.map((conv: Conversation) =>
          conv.conversationId === conversationId
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
      // Send WebSocket message to mark as seen
      ws?.send(
        JSON.stringify({
          type: "MARK_AS_SEEN",
          conversationId: conversationId,
        })
      );
    }
  }, [conversationId, currentConversation, queryClient, ws]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const loadMoreMessages = async () => {
    if (!conversationId || !hasMore) return;

    const nextPage = page + 1;
    const res = await axiosInstance.get(
      `/api/v2/conversation/get-messages/${conversationId}?page=${nextPage}`
    );
    queryClient.setQueryData(
      ["messages", conversationId, userId],
      (old: any = []) => [...res.data.messages.reverse(), ...old]
    );

    setPage(nextPage);
    setHasMore(res.data.hasMore);
  };

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        toast.error("Please grant permission to access your photo library");
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        await handleImageUpload(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      toast.error("Failed to pick image");
    }
  };

  const handleImageUpload = async (imageUri: string) => {
    if (!conversationId || !currentConversation) return;

    setIsUploading(true);

    try {
      // Create form data
      const formData = new FormData();
      formData.append("images", {
        uri: imageUri,
        type: "image/jpeg",
        name: "chat-image.jpg",
      } as any);
      // Upload image to your server
      const uploadResponse = await axiosInstance.post(
        "/api/v2/message/chat-image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const imageUrl = uploadResponse.data.imageUrl;

      // Normalize to absolute URL for display
      let finalImageUrl = imageUrl;
      if (finalImageUrl && finalImageUrl.startsWith("/")) {
        const base = (
          axiosInstance.defaults.baseURL ||
          process.env.EXPO_PUBLIC_SERVER_URI ||
          ""
        ).replace(/\/$/, "");
        finalImageUrl = base + finalImageUrl;
      }

      // Prepare payload
      const payload = {
        //@ts-ignore
        fromUserId: user?._id || user?.id,
        toUserId: currentConversation.seller.id,
        messageBody: "📷 Image",
        conversationId: conversationId,
        senderType: "user",
        imageUrl: finalImageUrl,
        messageType: "image",
      };

      // Send via WebSocket if available, otherwise fallback to HTTP persist
      if (ws && (ws as any).readyState === 1) {
        ws.send(JSON.stringify(payload));
      } else {
        try {
          await axiosInstance.post("/api/v2/message/create-new-message", {
            conversationId,
            text: payload.messageBody,
            //@ts-ignore
            sender: user?._id || user?.id,
            images: imageUrl,
          });
        } catch (err) {
          console.error("Image fallback HTTP failed", err);
        }
      }

      // Optimistically e (so mapping will set senderType correctly)
      const tempId = `temp-${Date.now()}`;
      const rawTemp = {
        _id: tempId,
        conversationId,
        //@ts-ignore
        sender: user?._id || user?.id,
        text: payload.messageBody,
        images: imageUrl,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData(
        ["messages", conversationId],
        (old: any = []) => [...old, rawTemp]
      );
      // Update conversation list
      queryClient.setQueryData(["conversations"], (old: any = []) =>
        old.map((conv: Conversation) =>
          conv.conversationId === conversationId
            ? {
                ...conv,
                lastMessage: "📷 Image",
                lastMessageAt: new Date().toISOString(),
              }
            : conv
        )
      );

      scrollToBottom();
      toast.success("Image sent successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to send image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !conversationId || !currentConversation) return;

    const messageBody = messageText.trim();

    const payload = {
      //@ts-ignore
      fromUserId: user?._id || user?.id,
      toUserId: currentConversation.seller.id,
      messageBody,
      conversationId,
      senderType: "user",
      messageType: "text",
    };

    try {
      // If WS is connected

      if (ws && (ws as any).readyState === 1) {
        ws.send(JSON.stringify(payload));
        setMessageText("");
        return;
      }

      // Fallback: persist message over HTT
      console.warn("WebSocket not available — falling back to HTTP POST");
      const res = await axiosInstance.post(
        "/api/v2/message/create-new-message",
        {
          conversationId,
          text: messageBody,
          //@ts-ignore
          sender: user?._id || user?.id,
        }
      );

      const saved = res.data?.message;
      if (saved) {
        const newMessageObj = {
          id: saved._id,
          content: saved.text,
          senderType:
            (saved.sender?.toString
              ? saved.sender.toString()
              : //@ts-ignore
                saved.sender) === (user?._id || user?.id)
              ? "user"
              : "seller",
          seen: false,
          createdAt: saved.createdAt,
          imageUrl: saved.images,
          messageType: saved.images ? "image" : "text",
        };

        queryClient.setQueryData(
          ["messages", conversationId, userId],
          (old: any[] = []) => [...old, newMessageObj]
        );
        queryClient.setQueryData(["conversations"], (old: any[] = []) =>
          old.map((conv: Conversation) =>
            conv.conversationId === conversationId
              ? {
                  ...conv,
                  lastMessage: newMessageObj.content,
                  lastMessageAt: new Date().toISOString(),
                }
              : conv
          )
        );

        setMessageText("");
      }
    } catch (err) {
      console.error("Failed to send message", err);
      toast.error("Failed to send message");
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    setMessageText((prev) => prev + emoji.emoji);
    setShowEmojiPicker(false);
  };

  if (!currentConversation) {
    return (
      <SafeAreaView edges={["bottom"]} className="flex-1 pt-12 bg-white">
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

        {/* Header */}
        <View className="bg-white px-4 py-4 border-b border-gray-100">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-900">Chat</Text>
          </View>
        </View>
        {/* if Loading State */}
        <View className="flex-1 justify-center items-center">
          <View className="animate-spin">
            <Ionicons name="refresh" size={48} color="#6B7280" />
          </View>
          <Text className="text-gray-500 font-poppins-medium mt-4 text-center">
            Loading conversation ...
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 pt-12 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {/* Chat Header */}
      <View className="flex-row items-center p-4 border-b border-gray-100 bg-white">
        <TouchableOpacity
          onPress={() => {
            setSelectedConversationId(null);
            router.back();
          }}
          className="mr-3"
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>

        <Image
          source={{
            uri: `https://static.vecteezy.com/system/resources/thumbnails/033/047/263/small/online-shopping-concept-e-business-e-commerce-product-booking-and-ordering-payment-via-online-bank-using-credit-cards-to-pay-product-bills-convenience-online-stores-and-shop-on-the-internet-free-photo.jpg`,
          }}
          className="w-10 h-10 rounded-full"
          resizeMode="cover"
        />
        <View className="flex-1 ml-3">
          <Text className="text-gray-900 font-poppins-semibold">
            {currentConversation.seller.name}
          </Text>
          <Text className="text-gray-500 font-poppins-medium text-sm">
            {currentConversation.seller.isOnline ? "Offline" : "Online"}
          </Text>
        </View>

        <TouchableOpacity className="ml-3">
          <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Message */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 p-4"
        showsVerticalScrollIndicator={false}
      >
        {hasMore && messages?.length > 0 && (
          <View className="items-center mb-4">
            <TouchableOpacity
              onPress={loadMoreMessages}
              className="bg-gray-200 px-4 py-2 rounded-full"
            >
              <Text className="text-gray-700 font-poppins-medium text-sm">
                Load previous messages
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {messages.map((msg: ChatMessage, idx: number) => (
          <View
            className={`mb-4 ${
              msg.senderType === "user" ? "items-end" : "items-start"
            }`}
            key={msg.id || idx}
          >
            <View
              className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                msg.senderType === "user"
                  ? "bg-blue-600 rounded-br-none"
                  : "bg-gray-200 rounded-bl-none"
              }`}
            >
              {msg.messageType === "image" && msg.imageUrl ? (
                <Image
                  source={{ uri: msg.imageUrl }}
                  className="w-48 h-32 rounded-lg"
                  resizeMode="cover"
                />
              ) : (
                <Text
                  className={`font-medium ${
                    msg.senderType === "user" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {msg.content}
                </Text>
              )}

              <Text
                className={`text-xs mt-1 ${
                  msg.senderType === "user" ? "text-white/80" : "text-gray-500"
                }`}
              >
                {msg.time ||
                  new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Messsage Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="border-t border-gray-100 bg-white"
      >
        <View className="p-4 flex-row items-center">
          <TouchableOpacity
            className="mr-3"
            onPress={pickImage}
            disabled={isUploading}
          >
            {isUploading ? (
              <View className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Ionicons name="image-outline" size={24} color="#6B7280" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            className="mr-3"
            onPress={() => setShowEmojiPicker(true)}
          >
            <Ionicons name="happy-outline" size={24} color="#6B7280" />
          </TouchableOpacity>

          <View className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-3">
            <TextInput
              ref={messageInputRef}
              placeholder="Type your message ..."
              value={messageText}
              onChangeText={setMessageText}
              className="font-poppins-medium text-gray-900"
              multiline
              maxLength={1000}
              onSubmitEditing={handleSendMessage}
            />
          </View>
          <TouchableOpacity
            className="bg-blue-600 w-10 h-10 rounded-full items-center justify-center"
            onPress={handleSendMessage}
            disabled={!messageText.trim()}
          >
            <Ionicons name="send" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      {/* Emoji Picker Modal */}
      <Modal
        visible={showEmojiPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEmojiPicker(false)}
      >
        <View className="flex-1 bg-black/50">
          <View className="flex-1 mt-20 bg-white rounded-t-3xl">
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <Text className="text-lg font-semibold text-gray-900">
                Choose Emoji
              </Text>
              <TouchableOpacity onPress={() => setShowEmojiPicker(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View className="flex-1">
              <EmojiPicker
                emojis={emojis}
                recent={recentEmojis}
                autoFocus={false}
                loading={false}
                darkMode={false}
                perLine={7}
                onSelect={handleEmojiSelect}
                onChangeRecent={setRecentEmojis}
                backgroundColor={"#ffffff"}
                enabledCategories={[
                  "recent",
                  "emotion",
                  "emojis",
                  "activities",
                  "flags",
                  "food",
                  "places",
                  "nature",
                ]}
                defaultCategory={"emotion"}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
