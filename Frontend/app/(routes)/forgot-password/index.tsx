import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { TextInput } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

interface ForgotPasswordFormData {
  email: string;
}

export default function ForgotPasswordScreen() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const router = useRouter();

  //  forgot password form
  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    mode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  const handleBackToLogin = () => {
    router.back();
  };

  const onForgotPasswordSubmit = (data: ForgotPasswordFormData) => {
    console.log("Forgot password data:", data);
    // handle forgot password submission here
    setIsSubmitted(true);
  };

  const handleResendEmail = () => {
    const email = forgotPasswordForm.getValues("email");
    if (email) {
      console.log("Resending email to:", email);
    }
  };

  if (isSubmitted) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 px-6 justify-center">
          {/* Success Icon */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-6">
              <Ionicons name="mail-outline" size={40} color="#10B981" />
            </View>
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-4 text-ce">
            Check Your Email
          </Text>
          <Text className="text-gray-500 font- text-base ">
            We&apos;ve sent a password reset link to{"\n"}
            <Text className="font-medium text-gray-700">
              {forgotPasswordForm.getValues("email")}
            </Text>
          </Text>
        </View>
        {/* Instruction */}
        <View className="bg-blue-50 rounded-xl p-4 mb-8">
          <Text className="text-blue-800 font-medium text-sm mb-2">
            What&apos;s next?
          </Text>
          <Text className="text-blue-700 font- text-sm leading-5">
            1. Check your email inbox {"\n"}
            2. Click the reset link in the email{"\n"}
            3. Create a new password{"\n"}
            4. Sign in with your new password
          </Text>
        </View>

        {/* Resend Email button */}
        <TouchableOpacity
          className="bg-blue-600 rounded-xl py-4 mb-4"
          onPress={handleResendEmail}
        >
          <Text className="text-white text-center text-lg font-semibold">
            Resend Email
          </Text>
        </TouchableOpacity>
        {/* Back to login */}
        <TouchableOpacity
          className="border border-gray-300 rounded-xl py-4"
          onPress={handleBackToLogin}
        >
          <Text className="text-gray-700 text-center text-lg font-semibold">
            Back to Login
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
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
          <View className="flex-row items-center mb-4">
            <TouchableOpacity
              onPress={handleBackToLogin}
              className="mr-4 p-2 -ml-2"
            >
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-xl font-semibold text-gray-900">
              Forgot Password
            </Text>
          </View>
          {/* main content */}
          <View className="mt-8">
            <Text className="text-3xl font-bold text-gray-900 mb-4">
              Reset Your Password
            </Text>
            <Text className="text-gray-500 font- text-base mb-8 leading-6">
              Enter Your email address and we&apos;ll send you a link to reset
              your password
            </Text>
          </View>

          <View>
            {/* Email Field */}
            <View className="mt-2">
              <Text className="text-gray-800 text-base font-medium mb-3">
                Email address
              </Text>
              <Controller
                control={forgotPasswordForm.control}
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
                      forgotPasswordForm.formState.errors.email
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
                      //   editable={!loginMutation.isPending}
                    />
                    {forgotPasswordForm.formState.errors.email && (
                      <Text className="text-red-500 text-sm font- mt-1">
                        {forgotPasswordForm.formState.errors.email.message}
                      </Text>
                    )}
                  </View>
                )}
              />
            </View>

          {/* Submit Button */}
          <TouchableOpacity
            className={`rounded-xl py-4 my-6 ${
              forgotPasswordForm.formState.isValid ? "bg-blue-600" : "bg-gray-400"
            }`}
            // onPress={loginForm.handleSubmit(onLoginSubmit)}
          >
            <Text className="text-white text-center text-lg font-semibold">
              {" "}
           Send Reset Link
            </Text>
          </TouchableOpacity>

          {/* Help Text */}
          <View className=" rounded-xl p-4">
             <Text className="text-gray-600 font- text-sm text-center leading-5">
              Remember your password?{" "}
              <Text className="text-blue-600 font-medium" 
              onPress={handleBackToLogin}>
                Sign In
              </Text>
             </Text>
          </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
