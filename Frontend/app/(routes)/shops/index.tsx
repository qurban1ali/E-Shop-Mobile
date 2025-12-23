import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  FlatList,
} from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/utils/axiosInstance";
import ShopCard from "@/components/cards/shop.card";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import ShopSkeleton from "@/components/skelton/shop.skelton";

interface FilterState {
  categories: string[];
}

export default function ShopsScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
  });

  const itemsPerPage = 4;

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch shops with filters
  const { data: shopsData, isLoading } = useQuery({
    queryKey: ["shops", currentPage, filters, debouncedSearchQuery, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();

      params.append("page", currentPage.toString());
      params.append("limit", "4"); // Show 4 shops per page

      if (debouncedSearchQuery.trim()) {
        params.append("search", debouncedSearchQuery.trim());
      }

      if (filters.categories.length > 0) {
        params.append("categories", filters.categories.join(","));
      }

      const response = await axiosInstance.get("/api/v2/shop/all-shops", {
        params,
      });

      return response.data || { shops: [], pagination: { total: 0 } };
    },
  });

  const shops = shopsData?.shops || [];
  const totalPages = Math.ceil(
    (shopsData?.pagination?.total || 0) / itemsPerPage
  );

  const toggleFilter = (type: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const currentArray = prev[type] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter((item) => item !== value)
        : [...currentArray, value];
      return {
        ...prev,
        [type]: newArray,
      };
    });
    setCurrentPage(1); // Reset to first page when filter change
  };

  const categories = [
    "Electronics",
    "Fashion",
    "Home & Kitchen",
    "Sports & Fitness",
  ];

  const clearAllFilters = () => {
    setFilters({
      categories: [],
    });
    setCurrentPage(1);
  };

  const renderShop = ({ item }: { item: any }) => (
    <ShopCard shop={item} onPress={() => {
      const shopId = item?._id || item?.id;
      if (!shopId) return;
      router.push({
        pathname: "/(routes)/shop/[id]",
        params: { id: shopId },
      });
    }} />
  );

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      transparent={false}
      presentationStyle="pageSheet"
    >
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
          <Text className="text-xl font-poppins-bold text-gray-900">
            Filters
          </Text>

          <TouchableOpacity
            onPress={() => setShowFilters(false)}
            className="p-2"
          >
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Scrollable Filters */}
        <ScrollView className="flex-1" contentContainerClassName="px-4 pb-6">
          {/* Categories */}
          <View className="mb-8">
            <Text className="text-lg font-poppins-semibold text-gray-900 mb-4">
              Categories
            </Text>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                onPress={() => toggleFilter("categories", category)}
                className="flex-row items-center py-3"
              >
                <View
                  className={`w-6 h-6 rounded border-2 mr-4 items-center justify-center ${
                    filters.categories.includes(category)
                      ? "bg-blue-600 border-blue-600"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {filters.categories.includes(category) && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
                <Text className="text-gray-700 font-poppins-medium">
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        <View className="border-t border-gray-100 px-4 py-4 flex-row gap-3 bg-white">
          <TouchableOpacity
            onPress={clearAllFilters}
            className="flex-1 py-3.5 border border-gray-300 rounded-xl"
          >
            <Text className="text-center font-poppins-semibold text-gray-700">
              Clear All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowFilters(false)}
            className="flex-1 py-3.5 bg-blue-600 rounded-xl"
          >
            <Text className="text-center font-poppins-semibold text-white">
              Apply Filters
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    // Always show max 7 page buttons (you can change this number)
    const maxButtons = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    // Adjust start if we are near the end
    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <View className="flex-row items-center justify-center py-5 gap-2">
        {/* Previous Button */}
        <TouchableOpacity
          disabled={currentPage === 1}
          onPress={() => setCurrentPage(currentPage - 1)}
          className={`w-10 h-10 rounded-full items-center justify-center ${
            currentPage === 1 ? "opacity-40" : ""
          }`}
        >
          <Ionicons name="chevron-back" size={18} color="#374151" />
        </TouchableOpacity>

        {/* Page Numbers – Fixed positions, no jumping */}
        {pageNumbers.map((page) => (
          <TouchableOpacity
            key={page}
            onPress={() => setCurrentPage(page)}
            className={`w-10 h-10 rounded-full items-center justify-center transition-all ${
              page === currentPage
                ? "bg-blue-600"
                : "bg-white border border-gray-300"
            }`}
          >
            <Text
              className={`font-poppins-semibold text-sm ${
                page === currentPage ? "text-white" : "text-gray-700"
              }`}
            >
              {page}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Show "..." when there are more pages */}
        {endPage < totalPages && (
          <Text className="text-gray-500 px-2">...</Text>
        )}

        {/* Next Button */}
        <TouchableOpacity
          disabled={currentPage === totalPages}
          onPress={() => setCurrentPage(currentPage + 1)}
          className={`w-10 h-10 rounded-full items-center justify-center ${
            currentPage === totalPages ? "opacity-40" : ""
          }`}
        >
          <Ionicons name="chevron-forward" size={18} color="#374151" />
        </TouchableOpacity>
      </View>
    );
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 pt-14 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-poppins-bold text-gray-900">
            All Shops
          </Text>
          <TouchableOpacity onPress={() => setShowFilters(true)}>
            <Ionicons name="filter" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            placeholder="Search for shops..."
            value={searchQuery}
            onChangeText={handleSearchChange}
            className="flex-1 ml-3 font-poppins-medium text-gray-900"
          />
        </View>

        {/* Breadcrumb */}
        <Text className="text-sm text-gray-500 font-medium mt-2">
          Home . All Shops
        </Text>
      </View>

      {/* Shops list */}
      {isLoading ? (
        <View className="flex-1 bg-gray-50">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-4">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <ShopSkeleton key={i} />
            ))}
          </ScrollView>
        </View>
      ) : (
        <FlatList
          data={shops}
          renderItem={renderShop}
          keyExtractor={(item) => item._id.toString()}
          className="bg-gray-50"
          numColumns={2}
          columnWrapperStyle={{
            justifyContent: "space-between",
            marginBottom: 16,
          }}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={renderPagination}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons name="storefront-outline" size={64} color="#9CA3AF" />
              <Text className="text-xl font-poppins-bold text-gray-900 mt-4">
                No shops found
              </Text>
              <Text className="text-gray-500 text-center font-poppins-medium mt-2">
                Try adjusting your search or filters
              </Text>
            </View>
          }
        />
      )}

      {renderFilterModal()}
    </SafeAreaView>
  );
}
