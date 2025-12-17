import { Stack } from "expo-router";

export default function RoutesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}
    >
      {/* Auth routes */}
      <Stack.Screen name="login/index" />
      <Stack.Screen name="signup/index" />
      <Stack.Screen name="signup-otp/index" />
      <Stack.Screen name="forgot-password/index" />
      <Stack.Screen name="change-password/index" />
      
      {/* Dynamic routes - flat file structure */}
      <Stack.Screen name="shop" />
      <Stack.Screen name="product" />
      <Stack.Screen name="order-details" />
      <Stack.Screen name="chat" />
      
      {/* Regular routes */}
      <Stack.Screen name="products/index" />
      <Stack.Screen name="payment/index" />
      <Stack.Screen name="shipping/index" />
      <Stack.Screen name="my-orders/index" />
      <Stack.Screen name="notifications/index" />
      <Stack.Screen name="data-usage/index" />
      <Stack.Screen name="settings/index" />
    </Stack>
  );
}
