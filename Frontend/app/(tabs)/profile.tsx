import { View, Text, Image, TouchableOpacity, Modal } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import useUser from "@/hooks/useUser";
import { ScrollView } from "react-native-gesture-handler";
import { Ionicons, SimpleLineIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { toast } from "sonner-native";
import * as ImagePicker from "expo-image-picker";
import axiosInstance from "@/utils/axiosInstance";

export default function Profile() {
  const { user, updateUserData } = useUser();
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadedImageId, setUploadedImageId] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [showAIFeatures, setShowAIFeatures] = useState(false);
  const [appliedFeatures, setAppliedFeatures] = useState<string[]>([]);
  const [isApplyingAI, setIsApplyingAI] = useState(false);

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        toast.error("Permission Required");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setShowAIFeatures(true);
      }
    } catch (error) {
      toast.error("Failed to pick image. Please try again.");
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        toast.error("Sorry, we need camera permission to make this work!");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setShowAIFeatures(true);
      }
    } catch (error) {
      toast.error("Failed to take photo. Please try again.");
    }
  };

  const applyAIFeature = async (feature: string) => {
    if (!uploadedImageUrl) return;
    setIsApplyingAI(true);
    try {
      // Get the base URL Without nay existinig transformation
      const baseUrl = uploadedImageUrl.split("?")[0];
      // build transformation string based on selected features
      let transformations = [];
      // add the new feature
      switch (feature) {
        case "bg-remove":
          transformations.push("e-bgremove");
          break;

        case "relight":
          transformations.push("e-relight");
          break;

        case "quality-improve":
          transformations.push("e-retouch");
          break;

        default:
          break;
      }
      // Simulate loading time for better UX
      await new Promise((resolve) => setTimeout(resolve, 6000));

      const finalUrl = `${baseUrl}?tr=${transformations.join(",")}`;

      setUploadedImageUrl(finalUrl);

      // update applied feature
      if (appliedFeatures.includes(feature)) {
        setAppliedFeatures(appliedFeatures.filter((f) => f !== feature));
      } else {
        setAppliedFeatures([...appliedFeatures, feature]);
      }
      toast.success(`${feature} applied successfully!`);
    } catch (error) {
      console.error(`Error applying ${feature}:`, error);
      toast.error(`Failed to apply ${feature}. Please try again later.`);
    } finally {
      setIsApplyingAI(false);
    }
  };

  const logOutHander = async () => {
    await SecureStore.deleteItemAsync("user");
    await SecureStore.deleteItemAsync("access_token");

    router.replace("/(routes)/login");
  };

  const saveFinalImage = async () => {
    if (!uploadedImageUrl) return;

    try {
      const response = await axiosInstance.put(
        `/api/v2/user/update-avatar/${(user as any)?._id}`,
        {
          avatarUrl: uploadedImageUrl,
        }
      );

      if (response.data.success) {
        // update user data with new avatar
        if (response.data.user) {
          await updateUserData(response.data.user);
        }
        toast.success("Profile photo updated successfully!");
        setShowPhotoModal(false);
        setSelectedImage(null);
        setUploadedImageUrl(null);
        setShowAIFeatures(false);
        setAppliedFeatures([]);
      }
    } catch (error) {
      toast.error("Failed to update profile photo. Please try again.");
    }
  };
  const menuItems = [
    {
      id: "orders",
      title: "My Orders",
      subtitle: "Track your orders and view  history",
      icon: "bag-outline",
      iconColor: "#2563EB",
      iconBg: "#DBEAFE",
      //@ts-ignore
      onPress: () => router.push("/(routes)/my-orders"),
    },
    {
      id: "inbox",
      title: "Inbox",
      subtitle: "View your messages",
      icon: "mail-outline",
      iconColor: "#059669",
      iconBg: "#D1FAE5",
      onPress: () => router.push("/(tabs)/messages"),
    },
    {
      id: "notifications",
      title: "Notifications",
      subtitle: "Manage your notifications",
      icon: "notifications-outline",
      iconColor: "#D97706",
      iconBg: "#FEF3C7",
      // @ts-ignore
      onPress: () => router.push("/(routes)/notifications"),
    },
    {
      id: "shipping",
      title: "Shipping Address",
      subtitle: "Manage your delivery addresses",
      icon: "location-outline",
      iconColor: "#7C3AED",
      iconBg: "#EDE9FE",
      // @ts-ignore
      onPress: () => router.push("/(routes)/shipping"),
    },
    {
      id: "password",
      title: "Change Password",
      subtitle: "Update your account password",
      icon: "lock-closed-outline",
      iconColor: "#DC2626",
      iconBg: "#FEE2E2",
      // @ts-ignore
      onPress: () => router.push("/(routes)/change-password"),
    },
    {
      id: "settings",
      title: "Account Settings",
      subtitle: "Manage your account preferences",
      icon: "settings-outline",
      iconColor: "#6B7280",
      iconBg: "#F3F4F6",
      // @ts-ignore
      onPress: () => router.push("/(routes)/settings"),
    },
  ];
  const uploadToCloudinary = async (imageUri: string) => {
    const data = new FormData();
    data.append("file", {
      uri: imageUri,
      name: "avatar.jpg",
      type: "image/jpeg",
    } as any);

    data.append("upload_preset", "ecommrence");
    data.append("cloud_name", "du6xqru9r");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/du6xqru9r/image/upload",
      {
        method: "POST",
        body: data,
      }
    );

    const result = await res.json();
    return result.secure_url;
  };

  const uploadImage = async (imageUri: string) => {
    try {
      setIsUploading(true);

      // 1) Upload to Cloudinary only (for AI processing)
      const cloudinaryUrl = await uploadToCloudinary(imageUri);

      if (!cloudinaryUrl) {
        toast.error("Cloudinary upload failed");
        return;
      }

      // 2) Set the uploaded URL for AI processing
      setUploadedImageUrl(cloudinaryUrl);
      setUploadedImageId("temp_" + Date.now()); // temporary ID
      toast.success("Image uploaded! Apply AI features or save now.");

    } catch (error: any) {
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const renderPhotoModal = () => (
    <Modal
      visible={showPhotoModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
          <Text className="text-xl font-medium text-gray-800">
            Change Photo
          </Text>
          <TouchableOpacity
            onPress={() => {
              setShowPhotoModal(false);
              setSelectedImage(null);
              setShowAIFeatures(false);
            }}
          >
            <Ionicons name="close" size={24} color="#6B7280 " />
          </TouchableOpacity>
        </View>
        <ScrollView className="flex-1 p-4">
          {!selectedImage ? (
            // upload option
            <View className="gap-2">
              <Text className="text-lg font-medium text-gray-700">
                Choose how you want to add your photo
              </Text>
              <TouchableOpacity
                className="flex-row mb-2 items-center p-4 border border-gray-200 rounded-xl"
                onPress={takePhoto}
              >
                <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
                  <Ionicons name="camera" size={24} color="#2563EB" />
                </View>
                <View className="flex-1">
                  <Text className="flex-lg font-semibold text-gray-800">
                    Take Photo
                  </Text>
                  <Text className="text-gray-500 font-medium">
                    Use your camera to take a new photo
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center p-4 border border-gray-200 rounded-xl"
                onPress={pickImage}
              >
                <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-4">
                  <Ionicons name="images" size={24} color="#059669" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-800">
                    Choose from Library
                  </Text>
                  <Text className="text-gray-500 font-medium">
                    Select a photo from gallery
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          ) : (
            //Image Preview and Ai feature
            <View className="space-y-6">
              <View className="items-center">
                {isApplyingAI ? (
                  <View className="h-32 w-32 rounded-full bg-gray-100 items-center justify-center">
                    <View className="animate-spin">
                      <Ionicons name="refresh" size={32} color="#6B7280" />
                    </View>
                    <Text className="text-xs text-gray-500 mt-2">
                      Applying AI...
                    </Text>
                  </View>
                ) : (
                  <Image
                    key={uploadedImageUrl || selectedImage}
                    source={{ uri: uploadedImageUrl || selectedImage }}
                    className="w-32 h-32 rounded-full"
                    resizeMode="cover"
                  />
                )}

                <Text className="text-base font-medium text-gray-800">
                  Preview
                </Text>
              </View>
              {!uploadedImageUrl ? (
                //  upload button
                <View className="space-y-4">
                  <Text className="text-lg font-semibold">
                    Ready to upload your photo?
                  </Text>
                  <TouchableOpacity
                    className="py-3 bg-blue-600 rounded-xl"
                    onPress={() => selectedImage && uploadImage(selectedImage)}
                    disabled={isUploading}
                  >
                    <Text className="text-center font-semibold text-white">
                      {isUploading ? "Uploading" : "Upload Photo"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // AiFeatured
                <View className="gap-4">
                  <Text className="text-lg font-medium text-gray-700">
                    Enhance your photo with AI
                  </Text>
                  <View className="gap-3">
                    <TouchableOpacity
                      className={`flex-row items-center p-3 border rounded-xl ${
                        appliedFeatures.includes("bg-remove")
                          ? "border-purple-300"
                          : "border-gray-200"
                      }`}
                      onPress={() => applyAIFeature("bg-remove")}
                      disabled={isApplyingAI}
                    >
                      <View className="h-10 w-10 bg-purple-50 rounded-lg items-center justify-center">
                        <Ionicons name="crop" size={20} color="#7C3AED" />
                      </View>
                      <View className="flex-1">
                        <Text className="font-semibold text-gray-900">
                          Remove Backgound
                        </Text>
                        <Text className="text-gray-500 text-sm font-medium">
                          Remove background automatically
                        </Text>
                      </View>
                      {appliedFeatures.includes("bg-remove") && (
                        <View className="w-6 h-6 bg-purple-600 rounded-full items-center justify-center">
                          <Ionicons name="checkmark" size={16} color="white" />
                        </View>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      className={`flex-row items-center p-3 border rounded-xl ${
                        appliedFeatures.includes("relight")
                          ? "border-yellow-300 bg-yellow-50"
                          : "border-gray-200"
                      }`}
                      onPress={() => applyAIFeature("relight")}
                      disabled={isApplyingAI}
                    >
                      <View className="h-10 w-10 bg-yellow-50 rounded-lg items-center justify-center">
                        <Ionicons name="sunny" size={20} color="#D97706" />
                      </View>
                      <View className="flex-1">
                        <Text className="font-semibold text-gray-900">
                          Relight
                        </Text>
                        <Text className="text-gray-500 text-sm font-medium">
                          Improve lighting and shadows
                        </Text>
                      </View>
                      {appliedFeatures.includes("relight") && (
                        <View className="w-6 h-6 bg-yellow-600 rounded-full items-center justify-center">
                          <Ionicons name="checkmark" size={16} color="white" />
                        </View>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      className={`flex-row items-center p-3 border rounded-xl ${
                        appliedFeatures.includes("quality-improve")
                          ? "border-blue-300 bg-blue-50"
                          : "border-gray-200"
                      }`}
                      onPress={() => applyAIFeature("quality-improve")}
                      disabled={isApplyingAI}
                    >
                      <View className="h-10 w-10 bg-blue-50 rounded-lg items-center justify-center">
                        <Ionicons name="sparkles" size={20} color="#2563EB" />
                      </View>
                      <View className="flex-1">
                        <Text className="font-semibold text-gray-900">
                          Quality Improve
                        </Text>
                        <Text className="text-gray-500 text-sm font-medium">
                          Enhance image quality and resolution
                        </Text>
                      </View>
                      {appliedFeatures.includes("quality-improve") && (
                        <View className="w-6 h-6 bg-blue-600 rounded-full items-center justify-center">
                          <Ionicons name="checkmark" size={16} color="white" />
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View className="flex-row gap-3 pt-4">
                <TouchableOpacity
                  className="flex-1 py-3 border border-gray-300 rounded-xl"
                  onPress={() => {
                    setSelectedImage(null);
                    setUploadedImageUrl(null);
                    setShowAIFeatures(false);
                  }}
                >
                  <Text className="text-center font-semibold text-gray-700">
                    Cancel
                  </Text>
                </TouchableOpacity>
                {uploadedImageUrl && (
                  <TouchableOpacity
                    className="flex-1 py-3 bg-blue-600 "
                    onPress={saveFinalImage}
                  >
                    <Text className="text-center ">Save Photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 pt-12 bg-white">
      <StatusBar style="dark" backgroundColor="#ffffff" />

      {/* header */}
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">Profile</Text>
        <Text className="text-sm text-gray-500 font-medium mt-1">
          Welcome back, {user?.name || "User"} 👋
        </Text>
      </View>

      <ScrollView className="flex-1 " showsVerticalScrollIndicator={false}>
        <View className="p-4">
          {/* Profile header card */}
          <View className="bg-white rounded-2xl shadow-[0_0_3px_rgba(0,0,0,0.1)] border border-gray-100 p-6 mb-6">
            <View className="flex-row items-center mb-6">
              <View className="relative items-center mb-6">
                <View className="relative">
                  <Image
                    source={{
                      uri:
                        user?.avatar?.url ||
                        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQInby7t43TRm43pIHpenrZV1n0fN1eB9Fc0Q&s",
                    }}
                    className="w-20 h-20 rounded-full"
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full items-center justify-center"
                    onPress={() => setShowPhotoModal(true)}
                  >
                    <Ionicons name="camera" size={12} color={"#fff"} />
                  </TouchableOpacity>
                </View>
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-xl font-bold text-gray-900">
                  {user?.name || "User Name"}
                </Text>
                <Text className="text-gray-500 font-medium ">
                  {user?.email || "user@exemple.com"}
                </Text>
                <TouchableOpacity
                  className="mt-2"
                  onPress={() => setShowPhotoModal(true)}
                >
                  <Text className="text-blue-600 font-medium text-sm">
                    Change Photo
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            {/* Quick State */}
            <View className="flex-row gap-4">
              <View className="flex-1 bg-gray-50 rounded-xl p-4">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="time-outline" size={16} color={"#6B7280"} />
                  <Text className="text-gray-600 font-meduim ml-2 text-sm">
                    Orders
                  </Text>
                </View>
                <Text className="text-xl font-bold">7</Text>
              </View>

              <View className="flex-2 bg-gray-50 rounded-xl px-1 py-4">
                <View className="flex-row items-center mb-2">
                  <SimpleLineIcons
                    name="user-following"
                    size={16}
                    color={"#6B7280"}
                  />
                  <Text className="text-gray-600 font-meduim ml-2 text-sm">
                    Following
                  </Text>
                </View>
                <Text className="text-xl font-bold">24</Text>
              </View>

              <View className="flex-1 bg-gray-50 rounded-xl p-4">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="bag-outline" size={16} color={"#6B7280"} />
                  <Text className="text-gray-600 font-meduim ml-2 text-sm">
                    Cart
                  </Text>
                </View>
                <Text className="text-xl font-bold">4</Text>
              </View>
            </View>
          </View>

          {/* Menu Items */}
          <View className="gap-4">
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                className="bg-white rounded-2xl border border-gray-100 p-4 shadow-[0_0_1px_rgba(0,0,0,0.1)]"
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center">
                  <View
                    className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                    style={{ backgroundColor: item.iconBg }}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={24}
                      color={item.iconColor}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-900">
                      {item.title}
                    </Text>
                    <Text className="text-gray-500 font-medium text-sm">
                      {item.subtitle}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
          {/* logout button */}
          <TouchableOpacity
            className="bg-red-50 rounded-2xl border border-red-200 p-4 mt-6"
            onPress={() => logOutHander()}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <Text className="ml-2 font-semibold text-red-500 text-lg">
                Logout
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {renderPhotoModal()}
    </SafeAreaView>
  );
}
