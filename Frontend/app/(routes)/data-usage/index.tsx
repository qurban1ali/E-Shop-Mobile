import { View, Text, Alert, TouchableOpacity, ScrollView } from "react-native";
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { toast } from "sonner-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import { router } from "expo-router";

interface StorageInfo {
  totalSize: string;
  cacheSize: string;
  dataSize: string;
  imagesSize: string;
}

const DataUsageScreen = () => {
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    totalSize: "0 MB",
    cacheSize: "0 MB",
    dataSize: "0 MB",
    imagesSize: "0 MB",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStorageInfo();
  }, []);

  const loadStorageInfo = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();

      // calculate storage for diff category
      let totalSize = 0;
      let cacheSize = 0;
      let dataSize = 0;
      let imagesSize = 0;

      const keyValuePairs = await AsyncStorage.multiGet(keys);

      for (const [key, value] of keyValuePairs) {
        if (value) {
          const itemSize = new Blob([value]).size;
          totalSize += itemSize;
          // Category storage based on keynames
          if (
            key.includes("cache") ||
            key.includes("temp") ||
            key.includes("image")
          ) {
            cacheSize += itemSize;
          } else if (
            key.includes("user") ||
            key.includes("settings") ||
            key.includes("auth")
          ) {
            dataSize += itemSize;
          } else if (
            key.includes("image") ||
            key.includes("avatar") ||
            key.includes("photo")
          ) {
            imagesSize += itemSize;
          } else {
            dataSize += itemSize;
          }
        }
      }

      // Convert bytes to mb and format
      const formatSize = (bytes: number) => {
        const mb = bytes / (1024 * 1024);
        return mb > 0.1
          ? `${mb.toFixed(1)} MB`
          : `${(bytes / 1024).toFixed(1)} KB`;
      };

      const realStorageInfo = {
        totalSize: formatSize(totalSize),
        cacheSize: formatSize(cacheSize),
        dataSize: formatSize(dataSize),
        imagesSize: formatSize(imagesSize),
      };
      setStorageInfo(realStorageInfo);
    } catch (error) {
      console.error("Error loading storage info:", error);

      setStorageInfo({
        totalSize: "0 MB",
        cacheSize: "0 MB",
        dataSize: "0 MB",
        imagesSize: "0 MB",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearCache = async () => {
    Alert.alert("Clear Cache", "Are you sure you want to clear the cache?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "OK",
        style: "destructive",
        onPress: async () => {
          try {
            const keys = await AsyncStorage.getAllKeys();
            const cacheKeys = keys.filter(
              (key) =>
                key.includes("cache") ||
                key.includes("temp") ||
                key.includes("image")
            );
            if (cacheKeys.length > 0) {
              await AsyncStorage.multiRemove(cacheKeys);
              toast.success("Cache cleared successfully");
            } else {
              toast.info("No cache to clear");
            }

            await loadStorageInfo();
          } catch (error) {
            console.error("Error clearing cache:", error);
            toast.error("Error clearing cache");
          }
        },
      },
    ]);
  };

  const clearAllData = async () => {
    Alert.alert("Clear All Data", "Are you sure you want to clear all data?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear All Data",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.clear();
            toast.success("All data cleared successfully");
            await loadStorageInfo();
          } catch (error) {
            console.error("Error clearing all data:", error);
            toast.error("Error clearing all data");
          }
        },
      },
    ]);
  };

  const renderStorageCard = (
    title: string,
    size: string,
    icon: string,
    color: string,
    bgColor: string
  ) => (
    <View className="bg-white mb-4 px-3 py-2 rounded-2xl border border-gray-300">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View
            className="w-12 h-12 rounded-xl items-center justify-center mr-4"
            style={{ backgroundColor: bgColor }}
          >
            <Ionicons name={icon as any} size={24} color={color} />
          </View>
          <View>
            <Text className="text-gray-900 font-semibold text-lg">
              {" "}
              {title}
            </Text>
            <Text className="text-gray-500 font-medium text-sm"> {size}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderActionButton = (
    title: string,
    subTitle: string,
    icon: string,
    color: string,
    bgColor: string,
    onPress: () => void,
    isDestructive: boolean
  ) => (
    <TouchableOpacity
      className={`w-full  rounded-2xl mb-3 items-center flex-row px-3  ${
        isDestructive
          ? "bg-red-50 border border-red-200"
          : "border bg-gray-50 border-gray-200"
      }`}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center justify-between w-full my-3">
        <View className="flex-row ">
          <View
            className="w-12 h-12 rounded-xl flex items-center justify-center mr-4"
            style={{ backgroundColor: bgColor }}
          >
            <Ionicons name={icon as any} size={24} color={color} />
          </View>
          <View>
            <Text
              className={`font-semibold text-lg ${
                isDestructive ? "text-red-600" : "text-gray-900"
              }`}
            >
              {" "}
              {title}
            </Text>
            <Text
              className={`font-medium text-sm ${
                isDestructive ? "text-red-500" : "text-gray-500"
              }`}
            >
              {" "}
              {subTitle}
            </Text>
          </View>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={isDestructive ? "#dc2626" : "#9ca3af"}
        />
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView edges={["bottom"]} className="flex-1 pt-12 bg-gray-50">
        <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

        <View className="bg-white px-4 py-4 border-b border-gray-100">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <TouchableOpacity onPress={() => router.back()} className="mr-4">
                <Ionicons name="arrow-back" size={24} color="#374151" />
              </TouchableOpacity>
              <Text className="text-xl font-poppins-bold text-gray-900">
                Data Usage
              </Text>
            </View>
          </View>
        </View>
        {/* Loading State */}
        <View className="flex-1 justify-center items-center">
          <View className="animate-spin">
            <Ionicons name="refresh" size={48} color={"#6b7280"} />
          </View>
          <Text className="text-gray-700 font-medium mt-4 text-center">
            Loading Storage information ...
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 pt-12 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-xl font-poppins-bold text-gray-900">
              Data Usage
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* Card Info */}
        <View className="bg-blue-50 rounded-2xl p-4 mb-6">
          <View className="flex-row items-start">
            <Ionicons
              name="information-circle-outline"
              size={24}
              color={"#2563eb"}
            />
            <View className="flex-1 ml-3">
              <Text className="text-blue-900 font-semibold mb-1">
                Storage Management
              </Text>
              <Text className="text-blue-700 font-medium text-sm">
                Monitor and manage your app storage usage, Clear cache to free
                space or reset all data
              </Text>
            </View>
          </View>
        </View>
        {/* storage overview */}
        <View className="mb-6">
          <Text className="text-gray-700 font-semibold text-lg mb-4">
            Storage Overview
          </Text>

          <View className=" bg-blue-600 rounded-2xl p-4 mb-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white font-semibold text-lg">
                  Total Storage Used
                </Text>
                <Text className="text-blue-100 font-medium text-sm">
                  App data and cache
                </Text>
              </View>
              <Text className="text-white font-bold text-2xl">
                {storageInfo.totalSize}
              </Text>
            </View>
          </View>

          {renderStorageCard(
            "Cache Data",
            storageInfo.cacheSize,
            "folder-outline",
            "#f59e0b",
            "#fef3c7"
          )}

          {renderStorageCard(
            "App Data",
            storageInfo.dataSize,
            "document-outline",
            "#059669",
            "#d1fae5"
          )}

          {renderStorageCard(
            "Images",
            storageInfo.imagesSize,
            "image-outline",
            "#7c3aed",
            "#ede9fe"
          )}
        </View>

        <View className="mb-6">
          <Text className="text-gray-700 font-semibold text-lg mb-4">
            Storage Actions
          </Text>

          {renderActionButton(
            "Clear Cache",
            "Remove temporary files and cache files",
            "trash-outline",
            "#f59e0b",
            "#fef3c7",
            clearCache,
            false
          )}
          {renderActionButton(
            "Clear All Data",
            "Reset app to factory setting",
            "warning-outline",
            "#dc2626",
            "#fee2e2",
            clearAllData,
            true
          )}
        </View>

        {/* Tips */}
        <View className="bg-green-50 rounded-2xl p-4 mb-6">
          <View className="flex-row items-start">
            <Ionicons name="bulb-outline" size={24} color={"#059669"} />
            <View className="ml-3 flex-1">
              <Text className="text-green-900 font-semibold mb-1">
                Storage Tips
              </Text>
              <Text className="text-green-700 font-medium text-sm">
                Clear Cache regularly to free up space {"\n"}
                Images are automatically cached for faster loading {"\n"}
                Clearing all data will reset your preference
              </Text>
            </View>
          </View>
        </View>
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default DataUsageScreen;
