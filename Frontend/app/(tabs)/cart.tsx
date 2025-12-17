import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Modal,
} from "react-native";
import React, { useState } from "react";
import { useStore } from "@/store";
import { toast } from "sonner-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/utils/axiosInstance";
import useUser from '@/hooks/useUser';

interface Address {
  _id?: string;
  addressType?: string;
  address1?: string;
  address2?: string;
  city?: string;
  country?: string;
  zipCode?: number;
  isDefault?: boolean;
}

export default function Cart() {
  const { cart, removeFromCart, addToCart } = useStore();
  const [couponCode, setCouponCode] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [storedCouponCode, setStoredCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState("");

  const { user } = useUser();

  // Fetch shipping addresses from user info (backend provides addresses on user object)
  const { data: userData } = useQuery({
    queryKey: ["shipping-address", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      try {
        const res = await axiosInstance.get(`/api/v2/user/user-info/${user?.id}`);
        return res.data.user;
      } catch (error) {
        console.error("Error fetching user addresses:", error);
        return { addresses: [] };
      }
    },
  });

  // Memoize addresses to avoid changing reference across renders
  const addresses: Address[] = React.useMemo(() => (userData?.addresses || []) as Address[], [userData]);

  // Set default address if none selected
  React.useEffect(() => {
    if (!selectedAddress && addresses.length > 0) {
      const defaultAddress =
        addresses.find((addr) => addr.isDefault) || addresses[0];
      setSelectedAddress(defaultAddress);
    }
  }, [addresses, selectedAddress]);

  const handleRemoveFromCart = (productId: string) => {
    removeFromCart(productId, null, null, "Mobile App");
    toast.success("Removed from cart!");
  };

  const handleUpdateQuantity = (product: any, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(product.id);
      return;
    }

    // Remove the current item and add it back with new quantity
    removeFromCart(product.id, null, null, "Mobile App");
    addToCart(
      {
        id: product.id,
        slug: product.slug || "slug",
        title: product.title,
        price: product.price,
        image: product.image,
        shopId: product.shopId,
        quantity: newQuantity,
      },
      null,
      null,
      "Mobile App"
    );
  };

  const handleProductPress = (product: any) => {
    router.push({
      pathname: "/(routes)/product",
      params: {
        id: product.id || product._id || product.slug,
      },
    });
  };

  const couponApplyHandler = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    try {
      const response = await axiosInstance.post("/order/api/verify-coupon", {
        couponCode: couponCode.trim(),
        cart: cart.map((item) => ({
          id: item.id,
          quantity: item.quantity || 1,
          sale_price: item.price,
          shopId: item.shopId,
        })),
      });

      const { discountAmount: discount, couponCode: validCouponCode } =
        response.data;

      setDiscountAmount(discount);
      setStoredCouponCode(validCouponCode);
      setCouponError("");
      toast.success(
        `Coupon ${validCouponCode} applied! Save: ${discount.toFixed(2)}`
      );
    } catch (error: any) {
      console.error("Coupon verification error:", error);
      setCouponError(error.response?.data.message || "Invalid coupon code");
      setDiscountAmount(0);
      setStoredCouponCode("");
    }
  };

  const calculateSubtotal = () => {
    return cart.reduce(
      (total, item) => total + item.price * (item.quantity || 1),
      0
    );
  };

  const subtotal = calculateSubtotal();
  const total = subtotal; //add shipping, texes etc. here if needed

  if (cart.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        {/* header */}
        <View className="px-4 py-4 border-b border-gray-100">
          <Text className="text-2xl font-bold text-gray-900">Shopping Cart</Text>
          <Text className="text-sm text-gray-500 font-medium mt-1">Home . Cart</Text>
        </View>

        {/* Empty state */}
        <View className="flex-1 justify-center items-center px-4">
          <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-6">
            <Ionicons name="bag-outline" size={48} color="#9CA3AF" />
          </View>
          <Text className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</Text>
          <Text className="text-gray-500 text-center font-medium mb-8">
            Start shopping to add items to your cart
          </Text>
          <TouchableOpacity
            className="bg-blue-600 px-8 py-4 rounded-xl"
            onPress={() => router.push("/(tabs)")}
          >
            <Text className="text-white font-semibold text-lg">Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="ffffff" />

      {/* header */}
      <View className="px-4 py-4 border-b border-gray-100 ">
        <Text className="text-2xl font-bold text-gray-900">Shopping Cart</Text>
        <Text className="text-sm text-gray-500 font-medium mt-1">
          Home . Cart
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Cart Items */}
        <View className="px-4 py-6">
          {cart.map((product, index) => (
            <View
              key={product.id}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-4 overflow-hidden"
            >
              <View className="p-4">
                <View className="flex-row">
                  {/* Product Image */}
                  <TouchableOpacity
                    className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden mr-4"
                    onPress={() => handleProductPress(product)}
                  >
                    <Image
                      source={{
                        uri:
                          product.image ||
                          "https://images.unsplash.com/photo-1441986300917-64674bd600d8?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8c3RvcmV8ZW58MHx8MHx8fDA%3D",
                      }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                  {/* Product Details */}
                  <View className="flex-1">
                    <TouchableOpacity
                      onPress={() => handleProductPress(product)}
                    >
                      <Text
                        className="text-lg font-semibold text-gray-900 mb-2"
                        numberOfLines={2}
                      >
                        {product.title}
                      </Text>
                    </TouchableOpacity>
                    {/* Price */}
                    <Text className="text-xl font-bold text-blue-600 mb-4">
                      ${product.price}
                    </Text>

                    {/* Action button / Quantity  and Remove */}
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                        <TouchableOpacity
                          onPress={() =>
                            handleUpdateQuantity(
                              product,
                              (product.quantity || 1) - 1
                            )
                          }
                          className="w-8 h-8 bg-white rounded-full items-center justify-center"
                        >
                          <Ionicons name="remove" size={16} color="#6B7280" />
                        </TouchableOpacity>

                        {/* Quantity Display */}
                        <Text className="mx-4 text-lg font-semibold text-gray-900">
                          {product.quantity || 1}
                        </Text>

                        {/* Increase Quantity Button (The main part of the image) */}
                        <TouchableOpacity
                          onPress={() =>
                            handleUpdateQuantity(
                              product,
                              (product.quantity || 1) + 1
                            )
                          }
                          className="w-8 h-8 bg-white rounded-full items-center justify-center"
                        >
                          <Ionicons name="add" size={16} color="#6B7280" />
                        </TouchableOpacity>
                      </View>
                      {/* Remove Button */}
                      <TouchableOpacity
                        className="px-4 py-2"
                        onPress={() => handleRemoveFromCart(product.id)}
                      >
                        <View className="flex-row items-center">
                          <Ionicons name="close" size={16} color="#EF4444" />
                          <Text className="text-red-500 font-medium ml-1">
                            Remove
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Order Summary */}
        <View className="px-4 pb-6">
          <View className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <Text className="text-xl font-bold text-gray-900 mb-6">
              Order Summary
            </Text>

            {/* Subtotal */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-gray-600 font-medium">Subtotal</Text>
              <Text className="text-lg font-bold text-gray-900">
                ${subtotal.toFixed(2)}
              </Text>
            </View>

            {/* Coupon Section */}
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-3">
                Have a Coupon?
              </Text>
              <View className="flex-row">
                {/* Coupon Code Input */}
                <TextInput
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-3 mr-2"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChangeText={setCouponCode}
                />

                {/* Apply Button */}
                <TouchableOpacity
                  className="bg-blue-600 px-6 py-3 rounded-lg"
                  onPress={couponApplyHandler}
                >
                  <Text className="text-white font-semibold">Apply</Text>
                </TouchableOpacity>
              </View>
              {couponError ? (
                <Text className="text-red-500 font-medium text-sm mt-2">
                  {couponError}
                </Text>
              ) : storedCouponCode ? (
                <Text className="text-green-600 font-medium text-sm mt-2">
                  Coupon &quot;{storedCouponCode}&quot; applied! Save: $
                  {discountAmount.toFixed(2)}
                </Text>
              ) : null}
            </View>

            {/* Shipping Address */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-semibold text-gray-900">
                  Select Shipping Address
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/(routes)/shipping")}
                  className="px-3 py-1"
                >
                  <Text className="text-blue-600 font-medium text-sm">
                    Manage
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                className="border border-gray-300 rounded-lg px-4 py-3"
                onPress={() => setShowAddressModal(true)}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="font-medium text-gray-900">
                    {selectedAddress
                      ? `${selectedAddress.address1 || ""}${selectedAddress.address2 ? `, ${selectedAddress.address2}` : ""} - ${selectedAddress.city || ""}${selectedAddress.country ? `, ${selectedAddress.country}` : ""}`
                      : "Select shipping address"}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Payment method */}
            {/* <View className="mb-6">
              <Text className="text-lg font--semibold text-gray-900 mb-3">
                Select Payment Method
              </Text>
              <TouchableOpacity className="border border-gray-300 rounded-lg p-4">
                <View className="flex-row items-center justify-between">
                  <Text className="font-medium text-gray-900">
                    {paymentMethod}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </View>
              </TouchableOpacity>
            </View> */}

            {/* Total */}
            <View className="flex-row justify-between items-center mb-6 pt-4 border-t border-gray-200">
              <Text className="text-xl font-bold text-gray-900">Total</Text>
              <Text className="text-2xl font-bold text-gray-900">
                ${total.toFixed(2)}
              </Text>
            </View>

            {/* Proceed to Checkout */}
            <TouchableOpacity
              className="bg-gray-900 py-4 rounded-xl"
              onPress={async () => {
                if (!selectedAddress) {
                  toast.error("Please select a shipping address");
                  return;
                }

                try {
                  // Request Stripe payment intent (backend expects amount in cents)
                  const amountInCents = Math.round(total * 100);

                  const sessionResponse = await axiosInstance.post(
                    "/api/v2/payment/process",
                    { amount: amountInCents }
                  );

                  const { client_secret } = sessionResponse.data || {};

                  if (!client_secret) {
                    throw new Error("No client_secret returned from payment API");
                  }

                  // Navigate to payment screen with the returned client_secret
                  (router as any).push({
                    pathname: "/(routes)/payment",
                    params: { client_secret },
                  });
                } catch (err) {
                  console.error("Error creating payment session:", err);
                  toast.error("Failed to create payment session. Please try again.");
                }
              }}
              disabled={!selectedAddress}
            >
              <Text className="text-white font-semibold text-lg text-center">
                {!selectedAddress ? "Select Address First" : "Proceed to Checkout"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Bottom Spacing */}
        <View className="h-20" />
      </ScrollView>

      {/* Address Selection Modal */}
      <Modal
        visible={showAddressModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddressModal(false)}
      >
        <SafeAreaView className="flex-1 bg-white">
          {/* Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
            <Text className="text-xl font-bold text-gray-900">
              Select Shipping Address
            </Text>

            <TouchableOpacity onPress={() => setShowAddressModal(false)}>
              <Ionicons name="close" size={26} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Address List */}
          <ScrollView className="flex-1 px-4 py-3">
            {addresses.length === 0 ? (
              <View className="flex-1 justify-center items-center py-20">
                <Ionicons name="location-outline" size={60} color="#9ca3af" />
                <Text className="text-gray-500 font-medium text-lg mt-4">
                  No addresses found
                </Text>
                <TouchableOpacity
                  className="bg-blue-600 px-6 py-3 rounded-xl mt-4"
                  onPress={() => {
                    setShowAddressModal(false);
                    router.push("/(routes)/shipping");
                  }}
                >
                  <Text className="text-white font-semibold text-lg">
                    Add Address
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              addresses.map((addr: Address, index: number) => (
                <TouchableOpacity
                  key={addr._id ?? index}
                  onPress={() => {
                    setSelectedAddress(addr);
                    setShowAddressModal(false);
                  }}
                  className={`border p-4 rounded-xl mb-4 ${
                    selectedAddress?._id === addr._id
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-300"
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-lg font-semibold text-gray-900">
                      {addr.addressType}
                    </Text>

                    {selectedAddress?._id === addr._id ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color="#2563eb"
                      />
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={22}
                        color="#6b7280"
                      />
                    )}
                  </View>

                  <Text className="text-gray-700 mt-2">
                    {addr.address1}{addr.address2 ? `, ${addr.address2}` : ""}
                  </Text>
                  <Text className="text-gray-700">
                    {addr.city}{addr.country ? `, ${addr.country}` : ""}
                  </Text>
                  <Text className="text-gray-700">
                    {addr.zipCode ? `ZIP: ${addr.zipCode}` : ""}
                  </Text>
                </TouchableOpacity>
              ))
            )}

            <View className="h-10" />
          </ScrollView>

          {/* Add New Address Button */}
          <View className="p-4 border-t border-gray-200">
            <TouchableOpacity
              className="bg-black py-4 rounded-xl"
              onPress={() => {
                setShowAddressModal(false);
                router.push("/(routes)/shipping");
              }}
            >
              <Text className="text-white text-center font-semibold text-lg">
                Add New Address
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
