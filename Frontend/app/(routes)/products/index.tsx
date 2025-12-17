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
import ProductCard from "@/components/cards/product.card";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import ProductSkeleton from "@/components/skelton/product.skelton";

interface FilterState {
  priceRange: [number, number];
  categories: string[];
  colors: string[];
  sizes: string[];
}

export default function ProductsScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sliderWidth, setSliderWidth] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 1199],
    categories: [],
    colors: [],
    sizes: [],
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

  // Fetch products with filters
 const { data: productsData, isLoading } = useQuery({
  queryKey: ["products", currentPage, filters, debouncedSearchQuery, searchQuery],
  queryFn: async () => {
    const params = new URLSearchParams();

    params.append("page", currentPage.toString());
    params.append("limit", "4"); // Show 4 products per page

    if (debouncedSearchQuery.trim()) {
      params.append("search", debouncedSearchQuery.trim());
    }

    if (filters.categories.length > 0) {
      params.append("categories", filters.categories.join(","));
    }

    if (filters.colors.length > 0) {
      params.append("colors", filters.colors.join(","));
    }

    if (filters.sizes.length > 0) {
      params.append("sizes", filters.sizes.join(","));
    }

    params.append(
      "priceRange",
      `${filters.priceRange[0]},${filters.priceRange[1]}`
    );

    const response = await axiosInstance.get("/api/v2/product/get-all-products", {
    params,
  })

    return response.data || { products: [], pagination: { total: 0 } };
  },
});


  const products = productsData?.products || [];
  const totalPages = Math.ceil(
    (productsData?.pagination?.total || 0) / itemsPerPage
  );

  const updatePriceRange = (min: number, max: number) => {
    setFilters((prev) => ({
      ...prev,
      priceRange: [min, max],
    }));
    setCurrentPage(1);
  };

  // Slider functions
  const handleSliderPress = (event: any) => {
    if (sliderWidth === 0) return;
    const { locationX } = event.nativeEvent;
    const percentage = locationX / sliderWidth;
    const newValue = Math.round(percentage * 1199);

    // Determine which handle to move based on which side of the current range
    const currentMin = filters.priceRange[0];
    const currentMax = filters.priceRange[1];
    const currentRange = currentMax - currentMin;
    const midPoint = currentMin + currentRange / 2;

    if (newValue <= midPoint) {
      // Move min handle
      const clampedValue = Math.max(0, Math.min(newValue, currentMax - 50));
      updatePriceRange(clampedValue, currentMax);
    } else {
      // Move max handle
      const clampedValue = Math.max(currentMin + 50, Math.min(newValue, 1199));
      updatePriceRange(currentMin, clampedValue);
    }
  };

  const handleSearchChange = (text:string) => {
   setSearchQuery(text)
  }

  const categories = [
    "Electronics",
    "Fashion",
    "Home & Kitchen",
    "Sports & Fitness",
  ];


  const colors = [
    { name: "Black", value: "black", hex: "#000000" },
    { name: "Red", value: "red", hex: "#EF4444" },
    { name: "Green", value: "green", hex: "#10B981" },
    { name: "Yellow", value: "yellow", hex: "#F59E0B" },
    { name: "Blue", value: "blue", hex: "#3B82F6" },
    { name: "White", value: "white", hex: "#FFFFFF" },
    { name: "Orange", value: "orange", hex: "#F97316" },
  ];
  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

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
    setCurrentPage(1); //Reset to first page when filter change
  };

  const clearAllFilters = () => {
    setFilters({
      priceRange: [0, 1199],
      categories: [],
      colors: [],
      sizes: [],
    });
    setCurrentPage(1);
  };

  const renderProduct = ({ item }: { item: any }) => (
    <ProductCard product={item} />
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
          {/* Price Range */}
          <View className="mb-8">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Price Range
            </Text>
            <View className="flex-row justify-between mb-5">
              <Text className="text-gray-600 font-medium">
                ${filters.priceRange[0]}
              </Text>
              <Text className="text-gray-600 font-medium">
                ${filters.priceRange[1]}
              </Text>
            </View>
            {/*  Interactive Price Range Slider */}
            <View
              className="relative"
              onLayout={(event) => {
                setSliderWidth(event.nativeEvent.layout.width);
              }}
            >
              <View className="bg-gray-200 h-2 rounded-full">
                <View
                  className="bg-blue-600 h-2 rounded-full absolute"
                  style={{
                    left: `${(filters.priceRange[0] / 1199) * 100}%`,
                    width: `${
                      ((filters.priceRange[1] - filters.priceRange[0]) / 1199) *
                      100
                    }%`,
                  }}
                />
              </View>

              {/* min Price handler */}
              <TouchableOpacity
                className="absolute w-6 h-6 bg-blue-600 rounded-full -top-2 items-center justify-center"
                style={{
                  left: `${(filters.priceRange[0] / 1199) * 100}%`,
                  marginLeft: -12,
                }}
                onPress={() => {
                  const newMin = Math.max(0, filters.priceRange[0] - 100);
                  updatePriceRange(newMin, filters.priceRange[1]);
                }}
              >
                <View className="w-2 h-2 bg-white rounded-full" />
              </TouchableOpacity>

              {/* max price handler */}
              <TouchableOpacity
                className="absolute w-6 h-6 bg-blue-600 rounded-full -top-2"
                style={{
                  left: `${(filters.priceRange[1] / 1199) * 100}%`,
                  marginLeft: -12,
                }}
                onPress={() => {
                  const newMax = Math.min(1199, filters.priceRange[1] + 100);
                  updatePriceRange(filters.priceRange[0], newMax);
                }}
              >
                <View className="w-2 h-2 bg-white rounded-full" />
              </TouchableOpacity>
              {/* Slider Track Touch Area */}
              <TouchableOpacity
                className="absolute inset-0"
                onPress={handleSliderPress}
                activeOpacity={0.8}
              />
            </View>
            {/* Quick Price Presets */}
            <View className="flex-row flex-wrap mt-4 gap-2">
              {[
                { label: "Under $100", range: [0, 100] },
                { label: "$100-$300", range: [100, 300] },
                { label: "$300-$500", range: [300, 500] },
                { label: "$500+", range: [500, 1199] },
              ].map((preset) => (
                <TouchableOpacity
                  key={preset.label}
                  className={`px-3 py-2 rounded-full border ${
                    filters.priceRange[0] === preset.range[0] &&
                    filters.priceRange[1] === preset.range[1]
                      ? "bg-blue-600 border-blue-600"
                      : "border-gray-300"
                  }`}
                  onPress={() =>
                    updatePriceRange(preset.range[0], preset.range[1])
                  }
                >
                  <Text
                    className={`text-sm font-poppins-medium ${
                      filters.priceRange[0] === preset.range[0] &&
                      filters.priceRange[1] === preset.range[1]
                        ? "text-white"
                        : "text-gray-700"
                    }`}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

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
                  className={`w-6 h- h-6 rounded border-2 mr-4 items-center justify-center ${
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

          {/* Colors */}
          <View className="mb-8">
            <Text className="text-lg font-poppins-semibold text-gray-900 mb-4">
              Colors
            </Text>
            {colors.map((color) => {
              const isSelected = filters.colors.includes(color.value);
              return (
                <TouchableOpacity
                  key={color.value}
                  onPress={() => toggleFilter("colors", color.value)}
                  className="flex-row items-center py-3"
                >
                  <View
                    className={`w-8 h-8 rounded-full border-2 mr-4 items-center justify-center ${
                      isSelected ? "border-blue-600" : "border-gray-300"
                    }`}
                    style={{
                      backgroundColor: isSelected ? "#2563EB" : color.hex,
                    }}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color="white" />
                    )}
                  </View>
                  <Text
                    className={`font-poppins-medium ${
                      isSelected ? "text-blue-600" : "text-gray-700"
                    }`}
                  >
                    {color.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Sizes */}
          <View className="mb-8">
            <Text className="text-lg font-poppins-semibold text-gray-900 mb-4">
              Sizes
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {sizes.map((size) => {
                const isSelected = filters.sizes.includes(size);
                return (
                  <TouchableOpacity
                    key={size}
                    onPress={() => toggleFilter("sizes", size)}
                    className={`px-5 py-3 rounded-full border ${
                      isSelected
                        ? "bg-blue-600 border-blue-600"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    <Text
                      className={`font-poppins-medium ${
                        isSelected ? "text-white" : "text-gray-700"
                      }`}
                    >
                      {size}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
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
            All Products
          </Text>
          <TouchableOpacity onPress={() => setShowFilters(true)}>
            <Ionicons name="filter" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            placeholder="Search for products ..."
            value={searchQuery}
            onChangeText={handleSearchChange}
            className="flex-1 ml-3 font-poppins-medium text-gray-900"
          />
        </View>

        {/* Breadcrumb */}
        <Text className="text-sm text-gray-500 font-medium mt-2">
          Home . All Product
        </Text>
      </View>

      {/* product list */}
      {isLoading ? (
        <View className="flex-1 bg-gray-50">
          <View className="flex-row flex-wrap justify-between px-4 py-4">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <ProductSkeleton key={item} />
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
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
              <Ionicons name="search-outline" size={64} color="#9CA3AF" />
              <Text className="text-xl font-poppins-bold text-gray-900 mt-4">
                No products found
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
