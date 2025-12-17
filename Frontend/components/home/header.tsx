import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { TextInput } from 'react-native-gesture-handler'
import { Ionicons } from '@expo/vector-icons'

export default function Header() {
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
        {/* Nitification Icon */}
        <TouchableOpacity >
            <Ionicons name='notifications-outline' size={24} color="#9CA3AF" />
        </TouchableOpacity>

    </View>
  )
}