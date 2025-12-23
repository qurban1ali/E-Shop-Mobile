import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { TextInput } from 'react-native-gesture-handler'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import axiosInstance from '@/utils/axiosInstance'

export default function Header() {
  const { data: notificationsData } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/v2/notification/my-notifications");
      return res.data.notifications;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const unreadCount = notificationsData?.filter((n: any) => n.status === "Unread").length || 0;

  return (
    <View className='flex-row items-center justify-between px-4 bg-white mt-7'
    style={{
        paddingVertical:10,
    }} >
       <Text className='text-3xl font-railway text-gray-800 '>
         Shop
       </Text>
       {/* search input Field */}
       <View className='flex-1 mx-4'>
        <View className='flex-row items-center bg-[#F8F8F8] rounded-3xl px-4'>
       <TextInput
       placeholder='Search'
       placeholderTextColor="#9CA3AF"
       className='flex-1 mr-2 text-gray-800 py-2' />
       <Ionicons name='search' size={20} color="#9CA3AF" />
        </View>
       </View>
        {/* Notification Icon */}
        <TouchableOpacity onPress={() => router.push('/(routes)/notifications')} className="relative">
            <Ionicons name='notifications-outline' size={24} color="#9CA3AF" />
            {unreadCount > 0 && (
              <View className="absolute -top-2 -right-2 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center px-1">
                <Text className="text-white text-xs font-bold">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
        </TouchableOpacity>

    </View>
  )
}