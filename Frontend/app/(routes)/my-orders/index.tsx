import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StatusBar,
  ScrollViewBase,
  ScrollView,
} from "react-native";
import React, { useState } from "react";
import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { AxiosError } from "axios";

type OrderStatus =
  | "Ordered"
  | "Packed"
  | "Shipped"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled";
interface OrderItem {
  _id?: string;
  productId: string;
  quantity: number; // ✅ matches backend
  price: number;
  selectedOptions: {
    color: string;
    size: string;
  };
  product?: {
    id: string;
    title: string;
    name: string;
    images: string[];
    discountPrice: number;
    originalPrice: number;
  };
}

interface Order {
  id: string;
  createdAt: string;
  updatedAt: string;
  total: number;
  status: string;
  deliveryStatus: OrderStatus;
  items: OrderItem[];
  couponCode?: string;
  discountAmount?: number;
  shippingAddressId?: string;
  shopId: string;
  userId: string;
}

export default function MyOrders() {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "all">(
    "all"
  );

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      try {
        // Correct API path: backend mounts order routes under /api/v2/order
        const response = await axiosInstance.get(
          "/api/v2/order/get-user-orders"
        );

        return response.data.orders;
      } catch (err) {
        const error = err as AxiosError;
        console.error("MyOrders failed", error.response?.data || error.message);
        throw err;
      }
    },
  });

  const orders: Order[] = ordersData || [];

  // console.log("orders", orders)

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "Ordered":
        return { bg: "#FEF3C7", text: "#D97706", icon: "time-outline" };
      case "Packed":
        return { bg: "#DBEAFE", text: "#2563", icon: "cog-outline" };
      case "Shipped":
        return { bg: "#D1FAE5", text: "#059669", icon: "car-outline" };
      case "Out for Delivery":
        return { bg: "#FEF3C7", text: "#D97706", icon: "bicyle-outline" };
      case "Delivered":
        return {
          bg: "#D1FAE5",
          text: "#059669",
          icon: "checkmark-circle-outline",
        };
      case "Cancelled":
        return { bg: "#FEE2E2", text: "#DC2626", icon: "close-circle-outline" };
      default:
        return { bg: "#F3F4F6", text: "#6B7280", icon: "help-circle-outline" };
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case "Ordered":
        return "Ordered";
      case "Packed":
        return "Packed";
      case "Shipped":
        return "Shipped";
      case "Out for Delivery":
        return "Out for Delivery";
      case "Delivered":
        return "Delivered";
      case "Cancelled":
        return "Cancelled";
      default:
        return "Ordered";
    }
  };

  const filteredOrders =
    selectedStatus === "all"
      ? orders
      : orders.filter((order) => order.deliveryStatus === selectedStatus);

  const statusFilters = [
    { key: "all", label: "All" },
    { key: "Ordered", label: "Ordered" },
    { key: "Packed", label: "Packed" },
    { key: "Shipped", label: "Shipped" },
    { key: "Out for Delivery", label: "Out for Delivery" },
    { key: "Delivered", label: "Delivered" },
  ];

  const renderOrderCard = (order: Order) => {
    // Backend returns 'status' field, not 'orderStatus'
    // @ts-expect-error
    const statusConfig = getStatusColor(order.status || "Processing");
    //@ts-expect-error
    const orderNumber = ` #${order._id?.slice(-6)}`;
    const orderDate = new Date(order.createdAt).toLocaleDateString("en-GB");

    return (
      <View
        //@ts-expect-error
        key={order._id}
        className="bg-white rounded-2xl shadow-[0_0_1px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden"
      >
        {/* Order Header */}
        <View className="p-4 border-b border-gray-100">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-lg font-poppins-semibold text-gray-900">
              {orderNumber}
            </Text>
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: statusConfig.bg }}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name={statusConfig.icon as any}
                  size={14}
                  color={statusConfig.text}
                />
                <Text
                  className="ml-1 font-medium text-sm"
                  style={{ color: statusConfig.text }}
                >
                  {getStatusText((order.status || "Processing") as OrderStatus)}
                </Text>
              </View>
            </View>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-500 font-medium">{orderDate}</Text>
            <View className="items-end">
              <Text className="text-xl font-bold text-gray-900">
                ${order.total.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Item */}

        <View className="p-4">
          {order?.items?.map((item, index) => (
            <View
              //@ts-ignore
              key={item.product?.id || index}
              className={`flex-row items-center ${index !== 0 ? "mt-3" : ""}`}
            >
              <Image
                source={{
                  uri:
                    typeof item.product?.images?.[0] === "string"
                      ? item.product.images[0]
                      : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKDJ-k5R0nLJ59lacgc9UF0sZBFZ2dc-8b-Q&s",
                }}
                className="w-16 h-16 rounded-lg bg-gray-100"
                resizeMode="cover"
              />

              <View className="flex-1 ml-3">
                <Text className="text-gray-900 font-medium" numberOfLines={2}>
                  {item.product?.title || item.product?.name || "Product title missing"}
                </Text>

                <Text className="text-gray-500 font-medium text-sm mt-1">
                  Qty: {item.quantity}
                </Text>
                <View className="flex-row items-center mt-1 gap-2">
                  <Text className="text-gray-700 font-semibold text-sm">
                    $
                    {typeof item.product?.discountPrice === "number"
                      ? item.product.discountPrice.toFixed(2)
                      : "0.00"}
                  </Text>

                  {typeof item.product?.originalPrice === "number" &&
                    typeof item.product?.discountPrice === "number" &&
                    item.product.originalPrice !== item.product.discountPrice && (
                      <Text className="text-gray-400 text-xs line-through">
                        ${item.product.originalPrice.toFixed(2)}
                      </Text>
                    )}
                </View>

                {(item?.selectedOptions?.color ||
                  item?.selectedOptions?.size) && (
                  <Text className="text-gray-400 font-medium text-xs mt-1">
                    {[item?.selectedOptions?.size, item?.selectedOptions?.color]
                      .filter(Boolean)
                      .join(".")}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
        {/* Order Action */}
        <View className="px-4 pb-4">
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="bg-blue-600 py-3 rounded-xl px-7"
              onPress={() =>
                router.push({
                  //@ts-ignore
                  pathname: "/(routes)/order-details/[id]",
                  params: {
                    //@ts-expect-error
                    id: order._id,
                  },
                })
              }
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="location-outline" size={16} color="white" />
                <Text className="text-white font-semibold ml-2">
                  Track Order
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-gray-100 py-3 rounded-xl"
              onPress={() => console.log("ReOrder", orderNumber)}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="refresh-outline" size={16} color="#6b7280" />
                <Text className="text-gray-700 font-semibold ml-2">
                  Reorder
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };
  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 pt-12 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">My Orders</Text>
        </View>
      </View>

      {/* Status Filters */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row"
        >
          {statusFilters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              className={`px-4 py-2 rounded-full mr-3 ${
                selectedStatus === filter.key ? "bg-blue-600" : "bg-gray-100"
              }`}
              onPress={() => setSelectedStatus(filter.key as any)}
            >
              <Text
                className={`font-medium text-sm ${
                  selectedStatus === filter.key ? "text-white" : "text-gray-600"
                }`}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Orders List */}
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View className="flex-1 justify-center items-center py-20">
            <View className="animate-spin">
              <Ionicons name="refresh" size={48} color="#6B7280" />
            </View>
            <Text className="text-gray-500 font-medium mt-4 text-center text-lg">
              Loading orders ...
            </Text>
          </View>
        ) : filteredOrders.length === 0 ? (
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="bag-outline" size={64} color="#9CA3AF" />
            <Text className="text-gray-500 font-medium mt-4 text-center">
              No orders found
            </Text>
            <Text className="text-gray-400 font-medium text-center mt-2">
              {selectedStatus === "all"
                ? "You haven't placed any orders yet"
                : `No ${selectedStatus} orders`}
            </Text>
          </View>
        ) : (
          filteredOrders.map(renderOrderCard)
        )}
        {/* botom  Spacing */}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
