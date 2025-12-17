import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { TextInput } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import  { isAxiosError } from "axios";
import { toast } from "sonner-native";
import { useMutation } from "@tanstack/react-query";
import { authAPI, storeAuthData } from "@/config/api";

interface LoginFormData {
  email: string;  
  password: string;
}

const loginUser = async (userData: LoginFormData) => {
  try {
    const response = await authAPI.login(userData);
    // Store auth token and user data
    if (response.data.token && response.data.user) {
      await storeAuthData(response.data.token, response.data.user);
    }
    
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      if (!error.response) {
        throw new Error("Network error. Please check your connection!");
      }
      const status = error?.response?.status;
      const errorData = error?.response?.data;
      
      if (status === 400) {
        throw new Error(errorData?.message || "Invalid email or password");
      } else if (status && status >= 500) {
        throw new Error(errorData?.message || "Server error. Please try again later!");
      } else {
        throw new Error(errorData?.message || "Login failed");
      }
    }
    throw new Error("An unexpected error occurred");
  }
};

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  // login Form
  const loginForm = useForm<LoginFormData>({
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });


  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => { 
      toast.success("Welcome back!", {
        description: "You have been logged in successfully.",
      });
      router.replace("/(tabs)");
    },
    onError: (error: Error) => {
      toast.error("Login Failed", {
        description: error.message,
      });
    },
  });

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };


  const handleSignUpNavigation = () =>{
    router.push("/(routes)/signup")
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="mt-14">
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </Text>
            <Text className="text-gray-500 font- text-base">
              Sign in to your account
            </Text>
          </View>

          {/* Forms fields */}
          <View className="gap-6 mt-4">
            {/* Email Field */}
            <View className="mt-2">
              <Text className="text-gray-800 text-base font-medium mb-3">
                Email
              </Text>
              <Controller
                control={loginForm.control}
                name="email"
                rules={{
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Please enter a valid email",
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    className={`flex-row items-center bg-gray-50 rounded-xl px-4 py-4 border ${
                      loginForm.formState.errors.email
                        ? "border-red-500"
                        : "border-gray-200"
                    }`}
                  >
                    <MaterialCommunityIcons
                      name="email-outline"
                      size={20}
                      color={"#9CA3AF"}
                    />
                    <TextInput
                      className="flex-1 ml-3 text-gray-800 font-"
                      placeholder="Enter your email"
                      placeholderTextColor="#9CA3AF"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      //   @ts-ignore
                        editable={!loginMutation.isPending}
                    />
                    {loginForm.formState.errors.email && (
                      <Text className="text-red-500 text-sm font- mt-1">
                        {loginForm.formState.errors.email.message}
                      </Text>
                    )}
                  </View>
                )}
              />
            </View>

            {/* password field */}
            <View className="mt-2">
              <Text className="text-gray-800 text-base font-medium mb-3">
                Password
              </Text>
              <Controller
                control={loginForm.control}
                name="password"
                rules={{
                  required: "Password is required",
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    className={`flex-row items-center bg-gray-50 rounded-xl px-4 py-4 border ${
                      loginForm.formState.errors.password
                        ? "border-red-500"
                        : "border-gray-200"
                    }`}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#9CA3AF"
                    />
                    <TextInput
                      className="flex-1 ml-3 text-gray-800 font-"
                      placeholder="Enter your password"
                      placeholderTextColor="#9CA3AF"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      secureTextEntry={!showPassword}
                        editable={!loginMutation.isPending}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                         disabled={loginMutation.isPending}
                    >
                      <Ionicons
                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {loginForm.formState.errors.password?.message && (
                <Text className="text-red-500 text-sm mt-1">
                  {loginForm.formState.errors.password.message}
                </Text>
              )}
            </View>

            {/* forgot passsword */}
            <TouchableOpacity
              className="self-end mt-2"
              onPress={() => router.push("/(routes)/forgot-password")}
               disabled={loginMutation.isPending}
            >
              <Text className="text-blue-600 font-medium ">
                Forgot Password
              </Text>
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            className={`rounded-xl py-4 mt-6 ${
              loginForm.formState.isValid && !loginMutation.isPending ? "bg-blue-600" : "bg-gray-400"
            }`}
            onPress={loginForm.handleSubmit(onLoginSubmit)}
            disabled={!loginForm.formState.isValid || loginMutation.isPending}
          >
            <Text className="text-white text-center text-lg font-semibold">
              {loginMutation.isPending ? "Signing In..." : "Sign In"}
            </Text>
          </TouchableOpacity>
          {/* Divider */}
          <View className="flex-row items-center my-6">
            <View className="flex-1 h-px bg-gray-300" />

            <Text className="mx-4 text-gray-500 font-">
              Or using other method
            </Text>
            <View className="flex-1 h-px bg-gray-300" />
          </View>

          {/* Social Login Button */}
          <View className="space-y-4 mb-8">
            {/* Google Sign In */}
            <TouchableOpacity className="flex-row items-center mb-4 justify-center bg-white border border-gray-200 rounded-xl py-4"
            disabled={loginMutation.isPending}
            >
                <View className="w-6 h-6 mr-3">
                  <Image
                  source={{uri: "https://developers.google.com/identity/images/g-logo.png"}}
                  className="w-full h-full"
                  resizeMode="contain"
                  />
                </View>
                <Text className="text-gray-800 text-base">
                    Sign In with Google
                </Text>
            </TouchableOpacity>

            {/* Facebook Sign In */}
            <TouchableOpacity className="flex-row items-center mb-4 justify-center bg-white border border-gray-200 rounded-xl py-4">
              <Ionicons  
              name="logo-facebook"
              size={24}
              color="#1877F2"
              className="mr-3"
              />
              <Text className="text-gray-800 text-base">
                Sign In with Facebook
              </Text>
            </TouchableOpacity>

          </View>

          {/* Switch to sign  Up link */}
          <View className="flex-row justify-center mt-[-20px]">
            <Text className="text-gray-600 font-"> 
           Don&apos;t have an account?
            </Text> 
            <TouchableOpacity onPress={handleSignUpNavigation}>
              <Text className="text-blue-600 font-semibold">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
