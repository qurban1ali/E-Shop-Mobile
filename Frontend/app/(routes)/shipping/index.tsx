import { View, Text, TouchableOpacity, Modal, Platform, Pressable, ActivityIndicator, StatusBar } from 'react-native';
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { countries } from '@/utils/contries';
import useUser from '@/hooks/useUser';
import { toast } from 'sonner-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, TextInput } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import axiosInstance from '@/utils/axiosInstance';

interface Address {
  _id: string;
  addressType: "Default" | "Home" | "Office";
  address1: string;
  address2: string;
  city: string;
  country: string;
  province: string;
  zipCode: string;
}

type ModalType = 'add' | 'edit' | 'delete' | null;

const ShippingAddressScreen = () => {
  const queryClient = useQueryClient();
  const { user } = useUser();

  const [showModal, setShowModal] = useState<ModalType>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  const [formData, setFormData] = useState({
    addressType: "Home" as "Home" | "Office" | "Default",
    address1: "",
    address2: "",
    city: "",
    province: "",
    zipCode: "",
    country: "",
    isDefault: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  const filteredCountries = countries.filter((c) =>
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // -------------------------------------------------
  // FETCH USER + ADDRESSES
  // -------------------------------------------------
  const { data: userData, isLoading } = useQuery({
    queryKey: ["shipping-address",user?.id],
    queryFn: async () => {
      //@ts-ignore
      const res = await axiosInstance.get(`/api/v2/user/user-info/${user?._id}`);
      return res.data.user;
    },
  });

  const addresses: Address[] = userData?.addresses || [];

  // -------------------------------------------------
  // ICON FOR ADDRESS TYPE
  // -------------------------------------------------
  const getAddressIcon = (label: "Home" | "Office" | "Default") => {
    switch (label) {
      case "Home":
        return { name: "home-outline", color: "#2563eb" };
      case "Office":
        return { name: "briefcase-outline", color: "#059669" };
      case "Default":
        return { name: "location-outline", color: "#6b7280" };
      default:
        return { name: "location-outline", color: "#6b7280" };
    }
  };

  // -------------------------------------------------
  // ADDRESS TYPE COLORS
  // -------------------------------------------------
  const getAddressTypeColor = (label: "Home" | "Office" | "Default") => {
    switch (label) {
      case "Home":
        return { bg: "#DBEAFE", text: "#2563EB" };
      case "Office":
        return { bg: "#D1FAE5", text: "#059669" };
      case "Default":
        return { bg: "#F3F4F6", text: "#6B7280" };
      default:
        return { bg: "#F3F4F6", text: "#6B7280" };
    }
  };

  const handleSetDefault = (id: string) => {

  }

  // -------------------------------------------------
  // OPEN MODALS
  // -------------------------------------------------

  const openAddModal = () => {
    setFormData({
      addressType: "Home",
      address1: "",
      address2: "",
      city: "",
      province: "",
      zipCode: "",
      country: "",
      isDefault: false,
    });
    setSelectedAddress(null);
    setShowModal("add");
  };

  const openEditModal = (address: Address) => {
    setSelectedAddress(address);

    setFormData({
      addressType: address.addressType,
      address1: address.address1,
      address2: address.address2,
      city: address.city,
      province: address.province,
      zipCode: address.zipCode,
      country: address.country,
      isDefault: address.addressType === "Default",
    });

    setShowModal("edit");
  };

  const openDeleteModal = (address: Address) => {
    if (addresses.length === 1) {
      toast.error("You cannot delete the last address. Add another first.");
      return;
    }
    setSelectedAddress(address);
    setShowModal("delete");
  };

  // -------------------------------------------------
  // CLOSE MODAL
  // -------------------------------------------------
  const closeModal = () => {
    setShowModal(null);
    setSelectedAddress(null);
    setFormData({
      addressType: "Home",
      address1: "",
      address2: "",
      city: "",
      province: "",
      zipCode: "",
      country: "",
      isDefault: false,
    });
  };

  // -------------------------------------------------
  // DELETE ADDRESS
  // -------------------------------------------------
  const handleDeleteAddress = async (id: string) => {
    try {
      await axiosInstance.delete(`/api/v2/user/delete-user-address/${id}`);

      queryClient.invalidateQueries({ queryKey: ["shipping-address"] });
      toast.success("Address Deleted Successfully");

      closeModal();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete address");
    }
  };

  // -------------------------------------------------
  // ADD / EDIT ADDRESS (PUT)
  // -------------------------------------------------
  const handleSubmit = async () => {
    if (
      !formData.address1 ||
      !formData.city ||
      !formData.zipCode ||
      !formData.country
    ) {
      return toast.error("Please fill all required fields");
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        _id: selectedAddress?._id || undefined,
      };

      await axiosInstance.put(
        `/api/v2/user/update-user-addresses`,
        payload
      );

      toast.success(
        showModal === "edit"
          ? "Address Updated Successfully"
          : "Address Added Successfully"
      );

      queryClient.invalidateQueries({ queryKey: ["shipping-address"] });
      closeModal();
    } catch (error: any) {
      console.log("Address Error:", error);

      if (error.response?.data?.message?.includes("already exists")) {
        toast.error(`${formData.addressType} address already exists`);
      } else {
        toast.error("Failed to save address");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------
  // RENDER ADDRESS CARD
  // -------------------------------------------------

  const renderAddressCard = (address: Address) => {
    const iconConfig = getAddressIcon(address.addressType)
    const typeColor = getAddressTypeColor(address.addressType)

    return (
      <View key={address._id} className='bg-white rounded-2xl border border-gray-100 mb-4 overflow-hidden'>
        {/* Address Header */}
        <View className='p-4 borde-b border-gray-100'>
          <View className='flex-row items-center justify-between mb-2'>
            <View className='flex-row items-center'>
              <Ionicons name={iconConfig.name as any} size={20} color={iconConfig.color} />
              <Text className='text-lg font-semibold text-gray-900'>
                {address.addressType}
              </Text>
            </View>

            <View className='flex-row items-center'>
              <View className='px-3 py-1 rounded-full'
                style={{ backgroundColor: typeColor.bg }}>
                <Text className='font-medium text-sm capitalize' style={{ color: typeColor.text }}>
                  {address.addressType}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Address Details */}
        <View className='p-4'>
          <Text className='text-gray-700 font-medium mb-2'>
            {address.address1}
          </Text>
          <Text className='text-gray-700 font-medium mb-2'>
            {address.address2}
          </Text>
          <Text className='text-gray-700 font-medium mb-2'>
            {address.city},{address.zipCode}
          </Text>
          <Text className='text-gray-700 font-medium mb-3'>
            {address.province} ,{address.country}
          </Text>

          {/* Action Button */}
          <View className='flex-row gap-3'>
            {address.addressType === 'Home' || address.addressType === 'Office' && (
              <TouchableOpacity
                className='flex-1 bg-blue-600 py-3 rounded-xl'
                onPress={() => handleSetDefault(address._id)}>
                <View className='flex-row items-center justify-center'>
                  <Ionicons name='checkmark-circle-outline' size={16} color={'white'} />
                  <Text className='text-white font-semibold ml-2'>Set Default</Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              className='flex-1 bg-gray-100 py-3 rounded-xl'
              onPress={() => openEditModal(address)}>
              <View className='flex-row items-center justify-center'>
                <Ionicons name='create-outline' size={16} color={'#6b7280'} />
                <Text className='text-white font-semibold ml-2'>Edit</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              className='flex-1 bg-red-100 py-3 rounded-xl'
              onPress={() => openDeleteModal(address)}>
              <View className='flex-row items-center justify-center'>
                <Ionicons name='trash-outline' size={16} color={'#ef4444'} />
                <Text className='text-white font-semibold ml-2'>Delete</Text>
              </View>

            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  // -------------------------------------------------
  // RENDER MODAL
  // -------------------------------------------------

  const renderModal = () => {
    if (!showModal) return null;

    // small helpers used inside modal
    const onChange = (key: keyof typeof formData, value: string | boolean) => {
      setFormData(prev => ({ ...prev, [key]: value }));
    };

    const selectCountry = (countryCode: string) => {
      setFormData(prev => ({ ...prev, country: countryCode }));
      setShowCountryPicker(false);
      setCountrySearch('');
    };

    const clearCountrySearch = () => setCountrySearch('');
    return (
      <Modal
        visible={true}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
        transparent={Platform.OS === 'ios' ? true : false}
      >
        <SafeAreaView className="flex-1 bg-white">
          {/* Modal Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
            <View className="flex-row items-center">
              <Pressable onPress={closeModal} className="p-2 mr-2">
                <Ionicons name="close-outline" size={24} color="#374151" />
              </Pressable>
              <Text className="text-lg font-semibold text-gray-900">
                {showModal === 'add' ? 'Add Address' : showModal === 'edit' ? 'Edit Address' : 'Delete Address'}
              </Text>
            </View>

            {showModal !== 'delete' && (
              <Pressable
                onPress={handleSubmit}
                className="px-3 py-1 rounded-lg"
                accessibilityLabel="Save address"
              >
                {isSubmitting ? (
                  <ActivityIndicator />
                ) : (
                  <Text className="text-blue-600 font-semibold">
                    {showModal === 'edit' ? 'Update' : 'Save'}
                  </Text>
                )}
              </Pressable>
            )}
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 60 }} className="px-4">
            {/* Delete Confirmation */}
            {showModal === 'delete' && selectedAddress && (
              <View className="mt-6">
                <View className="p-6 bg-red-50 rounded-2xl border border-red-100">
                  <View className="flex-row items-start">
                    <Ionicons name="warning-outline" size={28} color="#dc2626" />
                    <View className="ml-3 flex-1">
                      <Text className="text-red-700 font-semibold text-lg">Delete Address</Text>
                      <Text className="text-sm text-red-600 mt-2">
                        Are you sure you want to delete this address? This action cannot be undone.
                      </Text>

                      <View className="flex-row mt-6 space-x-3">
                        <TouchableOpacity
                          className="flex-1 bg-gray-100 py-3 rounded-xl items-center"
                          onPress={closeModal}
                        >
                          <Text className="text-gray-700 font-semibold">Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          className="flex-1 bg-red-600 py-3 rounded-xl items-center"
                          onPress={() => selectedAddress && handleDeleteAddress(selectedAddress._id)}
                        >
                          <Text className="text-white font-semibold">Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Add / Edit Form */}
            {(showModal === 'add' || showModal === 'edit') && (
              <>
                {/* Address Type */}
                <View className="mt-6">
                  <Text className="text-sm font-medium text-gray-700 mb-2">Address Type</Text>
                  <View className="flex-row space-x-2">
                    {(['Home', 'Office', 'Default'] as const).map((type) => {
                      const isActive = formData.addressType === type;
                      return (
                        <Pressable
                          key={type}
                          onPress={() => onChange('addressType', type)}
                          className={`px-3 py-2 rounded-full border ${isActive ? 'border-blue-600' : 'border-gray-200'}`}
                        >
                          <Text className={`${isActive ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}>
                            {type}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Address 1 */}
                <View className="mt-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">Address Line 1</Text>
                  <TextInput
                    value={formData.address1}
                    onChangeText={(t) => onChange('address1', t)}
                    placeholder="e.g. 11 House 140"
                    className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-100"
                  />
                </View>

                {/* Address 2 */}
                <View className="mt-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">Address Line 2</Text>
                  <TextInput
                    value={formData.address2}
                    onChangeText={(t) => onChange('address2', t)}
                    placeholder="Apartment, suite, etc. (optional)"
                    className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-100"
                  />
                </View>

                <View className="flex-row space-x-3 mt-4">
                  {/* City */}
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-700 mb-2">City</Text>
                    <TextInput
                      value={formData.city}
                      onChangeText={(t) => onChange('city', t)}
                      placeholder="Enter your city"
                      className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-100"
                    />
                  </View>

                  {/* ZIP */}
     <View className="w-28">
                    <Text className="text-sm font-medium text-gray-700 mb-2">ZIP</Text>
                    <TextInput
                      value={String(formData.zipCode)}
                      onChangeText={(t) => onChange('zipCode', t)}
                      placeholder="Enter zip code"
                      keyboardType="numeric"
                      className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-100"
                    />
                  </View>
                </View>

                {/* Province */}
                <View className="mt-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">Province / State</Text>
                  <TextInput
                    value={formData.province}
                    onChangeText={(t) => onChange('province', t)}
                    placeholder="Enter your provice name"
                    className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-100"
                  />
                </View>

                {/* Country Selector */}
                <View className="mt-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">Country</Text>

                  <Pressable
                    onPress={() => setShowCountryPicker(true)}
                    className="flex-row items-center justify-between bg-gray-50 px-4 py-3 rounded-xl border border-gray-100"
                  >
                    <View className="flex-row items-center">
                      <Ionicons name="flag-outline" size={18} color="#6b7280" />
                      <Text className="ml-2 text-gray-700">{formData.country || 'Select country'}</Text>
                    </View>
                    <Ionicons name="chevron-down-outline" size={18} color="#6b7280" />
                  </Pressable>
                </View>

                {/* Is Default Toggle */}
                <View className="mt-4 flex-row items-center justify-between">
                  <View>
                    <Text className="text-sm font-medium text-gray-700">Set as default</Text>
                    <Text className="text-xs text-gray-500">Make this your default shipping address</Text>
                  </View>

                  <Pressable
                    onPress={() => onChange('isDefault', !formData.isDefault)}
                    className={`px-3 py-2 rounded-xl border ${formData.isDefault ? 'border-blue-600' : 'border-gray-200'}`}
                  >
                    <Ionicons name={formData.isDefault ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={formData.isDefault ? '#2563eb' : '#6b7280'} />
                  </Pressable>
                </View>

                {/* Buttons */}
                <View className="mt-6 mb-12 flex-row space-x-3">
                  <TouchableOpacity
                    className="flex-1 bg-gray-100 py-3 rounded-xl items-center"
                    onPress={closeModal}
                  >
                    <Text className="text-gray-700 font-semibold">Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-1 bg-blue-600 py-3 rounded-xl items-center"
                    onPress={handleSubmit}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="text-white font-semibold">
                        {showModal === 'edit' ? 'Update Address' : 'Save Address'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>

          {/* Country Picker Modal (overlay style) */}
          {showCountryPicker && (
            <Modal
              visible={true}
              animationType="slide"
              onRequestClose={() => setShowCountryPicker(false)}
              transparent={true}
            >
              <SafeAreaView className="flex-1 justify-end">
                <View className="bg-white rounded-t-2xl p-4 border-t border-gray-100 h-3/4">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-lg font-semibold">Select Country</Text>
                    <Pressable onPress={() => setShowCountryPicker(false)}>
                      <Ionicons name="close-outline" size={24} color="#374151" />
                    </Pressable>
                  </View>

                  <View className="flex-row items-center space-x-2 border-b border-gray-100 pb-3 mb-3">
                    <Ionicons name="search-outline" size={18} color="#6b7280" />
                    <TextInput
                      value={countrySearch}
                      onChangeText={setCountrySearch}
                      placeholder="Search country..."
                      className="flex-1"
                      autoFocus
                    />
                    {countrySearch.length > 0 && (
                      <Pressable onPress={clearCountrySearch} className="px-2">
                        <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                      </Pressable>
                    )}
                  </View>

                  <ScrollView showsVerticalScrollIndicator={true} className="mb-6">
                    {filteredCountries.length === 0 ? (
                      <View className="py-10 items-center">
                        <Text className="text-gray-500">No countries found</Text>
                      </View>
                    ) : (
                      filteredCountries.map((c: any) => (
                        <Pressable
                          key={c}
                          onPress={() => selectCountry(c)}
                          className="py-3 border-b border-gray-100 flex-row items-center justify-between"
                        >
                          <Text className="text-gray-700">{c}</Text>
                          {formData.country === c && <Ionicons name="checkmark" size={18} color="#2563eb" />}
                        </Pressable>
                      ))
                    )}
                  </ScrollView>

                  <View className="flex-row space-x-3">
                    <TouchableOpacity
                      className="flex-1 bg-gray-100 py-3 rounded-xl items-center"
                      onPress={() => setShowCountryPicker(false)}
                    >
                      <Text className="text-gray-700 font-semibold">Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </SafeAreaView>
            </Modal>
          )}
        </SafeAreaView>
      </Modal>
    );
  };


  return (
    <SafeAreaView edges={['bottom']} className='flex-1 pt-12 bg-gray-50'>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-4"
            >
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-xl font-poppins-bold text-gray-900">Shipping Address</Text>
          </View>

          <TouchableOpacity
            className='bg-blue-600 px-4 py-2 rounded-lg'
            onPress={openAddModal}>
            <View className='flex-row items-center'>
              <Ionicons name='add' size={20} color={'white'} />
              <Text className='text-white font-semibold ml-1'>
                Add New
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/*Content*/}
      <ScrollView className='flex-1 p-4' showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View className='flex-1 justify-center items-center py-20'>
            <View className='animate-spin'>
              <Ionicons name='refresh' size={48} color="#6b7280" />
            </View>
            <Text className='text-gray-600 font-medium mt-4 text-center text-lg'>
              Loading Addresses ....
            </Text>
          </View>
        ) : addresses.length === 0 ? (
          <View className='flex-1 justify-center items-center py-20'>
            <Ionicons name='location-outline' size={64} color="#9ca3af" />
            <Text className='text-gray-600 font-medium mt-4 text-center text-lg'>
              No Addrsses found
            </Text>
            <Text className='text-gray-400 font-medium mt-2 text-ellipsis'>
              Add your first shipping Address to get started
            </Text>
            <TouchableOpacity className='bg-blue-600 px-6 py-3 rounded-xl mt-6'
              onPress={openAddModal}>
              <Text className='text-white font-semibold'>
                Add Address
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {addresses.map(renderAddressCard)}

            {/* Add new address */}
            <TouchableOpacity className='bg-white border-2 border-dashed border-gray-300 p-6 items-center rounded-2xl '
              onPress={openAddModal}
              activeOpacity={0.7}>
              <View className='w-12 h-12 bg-blue-100 rounded-full items-center justify-center'>
                <Ionicons name='add' size={24} color={'#2563eb'} />
              </View>
              <Text className='text-gray-800 font-semibold textl-lg'>
                Add New Address
              </Text>
              <Text className='text-gray-400 font-medium mt-1'>
                Add your first shipping Address for faster checkout
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Bottom spacing */}
        <View className='h-20' />
      </ScrollView>
      {renderModal()}
    </SafeAreaView>
  );
};

export default ShippingAddressScreen;