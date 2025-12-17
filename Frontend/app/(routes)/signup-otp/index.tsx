import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,  
  TouchableOpacity,
} from "react-native";     
import React, { useEffect, useRef, useState } from "react";
import { router, useGlobalSearchParams } from "expo-router";
import { TextInput } from "react-native-gesture-handler";
import { toast } from "sonner-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { isAxiosError } from "axios";
import { useMutation } from "@tanstack/react-query";
import { authAPI, storeAuthData } from "@/config/api";

interface VerifyOTPData {
  otp: string;
  email: string;
  name: string;
  password: string;
}
interface ResendOTPData {
  email: string;
  name: string;
  password: string;
}

export default function SignupOtp() {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Get dynamic parametetars from signup screen
  const { name, email, password } = useGlobalSearchParams<{
    name: string;
    email: string;
    password: string;
  }>();

  // create  refs for each input
  const inputRefs = useRef<(TextInput | null)[]>([]);

  //   countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout | any;
    if (countdown > 0 && !canResend) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown, canResend]);

  //  start countdown on components mount
  useEffect(() => {
    setCanResend(false);
    setCountdown(60);
  }, []);

  // Validate required parameters
   useEffect(() => {
    if(!name || !email || !password){
      toast.error("Missing information", {
          description: "Required signup data is missing."
      })
      router.back();
    }
   }, [name, email, password])

  const verifyOTP = async (data: VerifyOTPData) => {
    try {
      const response = await authAPI.verifyOTP({
        otp: data.otp,
        email: data.email,
        name: data.name,
        password: data.password,
      });
      
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

        // handle different status codes
        const status = error?.response?.status;
        const errorData = error?.response?.data;
        if (status && (status === 400 || status === 422)) {
          throw new Error(errorData?.message || "Invalid OTP or signup data");
        } else if (status === 404) {
           throw new Error(errorData?.message || "OTP expired or not found");
        } else if (status === 409) {
           throw new Error(errorData?.message || "User already exist");
        } else if (status === 429) {
           throw new Error(
            errorData?.message || "Too many attemps. Please try again later."
          );
        } else if (status && status >= 500) {
           throw new Error(
            errorData?.message || "Server error. Please try again later!"
          );
        } else {
           throw new Error(errorData?.message || "Signup Failed");
        }
      }
      throw new Error("An unexpected error occured");
    }
  };

  //    api function for resending OTP
  const resendOTP = async (data: ResendOTPData) => {
    try {
      const response = await authAPI.resendOTP(data);
      return response.data;
    } catch (error) {
      if (isAxiosError(error)) {
        if (!error.response) {
          throw new Error("Network error. Please check your connection!");
        }

        // handle different status codes
        const status = error?.response?.status;
        const errorData = error?.response?.data;

        if (status && (status === 400 || status === 422)) {
           throw new Error(errorData?.message || "Invalid email addrress");
        } else if (status === 429) {
           throw new Error(
            errorData?.message ||
              "Too many request. Please wait before requesting again."
          );
        } else if (status && status >= 500) {
           throw new Error(
            errorData?.message || "Server error. Please try again later!1"
          );
        } else {
           throw new Error(errorData?.message || "failed to resend OTP");
        }
      }
      throw new Error("An unexpected error occured");
    }
  };

  const verifyOTPMutation = useMutation({
    mutationFn: verifyOTP,
    onSuccess: (data) => {
      toast.success("Welcome!", {
        description: `Account created successfully for ${name}!`,
      });

      // Navigate to next screen on succss
      router.replace("/(routes)/login");
    },
    onError: (error: Error) => {
      toast.error("verification Failed", {
        description: error.message,
      });
    },
  });

  const resendOTPMutaion = useMutation({
    mutationFn: resendOTP,
    onSuccess: (data) => {
      toast.success("OTP Sent!", {
        description: `A new OTP has been sent to ${email}.`,
      });
      // clear current Otp
      setOtp(["", "", "", ""]);
      //Focus first input
      inputRefs.current[0]?.focus();
      // Restart countdown
      setCanResend(false);
      setCountdown(60);
    },
    onError: (error: Error) => {
      toast.error("Resend Failed", {
        description: error.message,
      });
    },
  });

  const handleOtpChange = (value: string, index: number) => {
    // only allow single digit
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    //  auto focus next input if value is entered
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    //  handle backspace - go to previous input if current is empty
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = () => {
    const otpCode = otp.join("");
    if (otpCode?.length !== 4) {
      toast.error("Invalid OTP", {
        description: "Please enter complete 4-digit OTP",
      });
      return;
    }
    if (!name || !email || !password) {
      toast.error("Missing Information", {
        description: "Required signup data is missing",
      });
      return;
    }

    // Trigger the verification mutation with all signup data
    verifyOTPMutation.mutate({
        otp:otpCode,
        email:email,
        name:name,
        password:password
    })
  };

  const handleResendOTP = () => {
    if(!canResend || resendOTPMutaion.isPending) return;
    if(!email){
        toast.error("Missing Email", {
            description:"Email address is required to resend OTP."
        })
        return
    }
    // Trigger the resend mutation
    resendOTPMutaion.mutate({
        email: email as string,
        name: name as string,
        password:password as string
    })
  }

  const handleGoBack = () => {
    router.back();
  };

  //    auto-focus first input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const isOTPComplete = otp.every((digit) => digit !== "");
    const isVerifying = verifyOTPMutation.isPending;
    const isResending = resendOTPMutaion.isPending;
  //   format countdown time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 "
      >
        {/* Header with back button */}
        <View className="flex-row items-center px-6 mt-6 mb-8">
          <TouchableOpacity
            onPress={handleGoBack}
            className="mr-4 p-2 rounded-full bg-gray-100"
            disabled={isVerifying}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">Verify OTP</Text>
        </View>
        <View className="flex-1 px-6">
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-6">
              <Ionicons name="shield-checkmark" size={40} color={"#2563EB"} />
            </View>
            <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
              Hi {name || "Qurban"}! Verify Your Account
            </Text>
            <Text className="text-gray-500 text-center">
              We&apos;ve sent a 4-digit verification code to{" "}
              {email || "qurban@gmail.com"}
            </Text>
          </View>

          {/* OTP Input fields */}
          <View className="flex-row justify-center mb-8 gap-4">
            {otp?.map((digit, index) => (
              <View key={index} className="w-16 h-16">
                <TextInput
                  ref={(ref: TextInput | null): void => {
                    inputRefs.current[index] = ref;
                  }}
                  className={`w-full h-full text-center text-2xl font-bold border-2 rounded-xl ${
                    digit
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={({ nativeEvent }) =>
                    handleKeyPress(nativeEvent.key, index)
                  }
                  keyboardType="numeric"
                  maxLength={1}
                  selectTextOnFocus
                    editable={!isVerifying}
                />
              </View>
            ))}
          </View>
          {/* verify button */}
          <TouchableOpacity
            className={`rounded-xl py-4 mb-6 ${
              isOTPComplete && !isVerifying ? "bg-blue-600" : "bg-gray-400"
            }`}
            onPress={handleVerifyOtp}
            disabled={!isOTPComplete || isVerifying}
          >
            <Text className="text-white text-center text-lg">
                {isVerifying ? "verifying..." : "Verify OTP"}
            </Text>
          </TouchableOpacity>

          {/* Resend otp */}
          <View className="flex-row justify-center">
            <Text className="text-gray-600">Didn&apos;t receive the code?</Text>
            {canResend ? (
              <TouchableOpacity
              onPress={handleResendOTP}
              disabled={isResending}
              >
                <Text className={`font-semibold ml-1 ${
                        isResending ? "text-gray-400" : "text-blue-600"
                    } `}>
                        {isResending ? "Sending..." : "Resend OTP"}
                    </Text>
              </TouchableOpacity>
            ) : (
              <Text className="text-gray-400">
                {" "}
                Resend OTP ({formatTime(countdown)})
              </Text>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
