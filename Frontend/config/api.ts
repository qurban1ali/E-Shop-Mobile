import axios, { AxiosError, AxiosInstance } from "axios";
import { toast } from "sonner-native";
import * as SecureStore from "expo-secure-store";

const API_URL =
  process.env.EXPO_PUBLIC_SERVER_URI || "http://192.168.100.34:8000";

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log("Error retrieving token:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      try {
        await SecureStore.deleteItemAsync("authToken");
      } catch (e) {
        console.log("Error clearing token:", e);
      }
      // You can redirect to login here
    }
    return Promise.reject(error);
  }
);

// ✅ AUTH API FUNCTIONS

export const authAPI = {
  // Register with OTP
  register: (data: { name: string; email: string; password: string }) =>
    apiClient.post("/api/v2/auth/user-registration", data),

  // Verify OTP and create user
  verifyOTP: (data: {
    email: string;
    name: string;
    password: string;
    otp: string;
  }) => apiClient.post("/api/v2/auth/verify-user", data),

  // Resend OTP
  resendOTP: (data: { email: string; name: string }) =>
    apiClient.post("/api/v2/auth/resend-otp", data),

  // Login
  login: (data: { email: string; password: string }) =>
    apiClient.post("/api/v2/user/login-user", data),

  // Get current user
  getCurrentUser: () => apiClient.get("/api/v2/user/get-user"),

  // Logout
  logout: () => apiClient.post("/api/v2/user/logout"),

  // Update user profile
  updateProfile: (data: any) =>
    apiClient.put("/api/v2/user/update-user-info", data),

  // Change password
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    apiClient.post("/api/v2/user/change-password", data),
};

// ✅ PRODUCT API FUNCTIONS
export const productAPI = {
  getAllProducts: (page = 1) =>
    apiClient.get(`/api/v2/product/get-all-products?page=${page}`),

  getProductById: (id: string) =>
    apiClient.get(`/api/v2/product/get-product/${id}`),

  searchProducts: (query: string) =>
    apiClient.get(`/api/v2/product/search-products?query=${query}`),
};

// ✅ CART API FUNCTIONS
export const cartAPI = {
  addToCart: (productId: string, quantity: number) =>
    apiClient.post("/api/v2/cart/add-to-cart", { productId, quantity }),

  getCart: () => apiClient.get("/api/v2/cart/get-cart"),

  removeFromCart: (productId: string) =>
    apiClient.delete(`/api/v2/cart/remove-from-cart/${productId}`),

  updateCartQuantity: (productId: string, quantity: number) =>
    apiClient.put("/api/v2/cart/update-quantity", { productId, quantity }),
};

// ✅ ORDER API FUNCTIONS
export const orderAPI = {
  createOrder: (data: any) =>
    apiClient.post("/api/v2/order/create-order", data),

  getOrders: () => apiClient.get("/api/v2/order/get-orders"),

  getOrderById: (id: string) => apiClient.get(`/api/v2/order/get-order/${id}`),

  cancelOrder: (id: string) =>
    apiClient.post(`/api/v2/order/cancel-order/${id}`),
};

// ✅ PAYMENT API FUNCTIONS
export const paymentAPI = {
  createPaymentIntent: (data: any) =>
    apiClient.post("/api/v2/payment/create-payment-intent", data),

  confirmPayment: (data: any) =>
    apiClient.post("/api/v2/payment/confirm-payment", data),
};

// ✅ SHOP API FUNCTIONS
export const shopAPI = {
  getAllShops: (page = 1) =>
    apiClient.get(`/api/v2/shop/get-all-shops?page=${page}`),

  getShopById: (id: string) => apiClient.get(`/api/v2/shop/get-shop/${id}`),

  getShopProducts: (shopId: string) =>
    apiClient.get(`/api/v2/shop/get-shop-products/${shopId}`),
};

// ✅ STORE TOKEN AND USER
export const storeAuthData = async (token: string, user: any) => {
  try {
    await SecureStore.setItemAsync("authToken", token);
    await SecureStore.setItemAsync("user", JSON.stringify(user));
  } catch (error) {
    console.log("Error storing auth data:", error);
  }
};

// ✅ RETRIEVE TOKEN
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync("authToken");
  } catch (error) {
    return null;
  }
};

// ✅ RETRIEVE USER
export const getStoredUser = async (): Promise<any | null> => {
  try {
    const user = await SecureStore.getItemAsync("user");
    return user ? JSON.parse(user) : null;
  } catch (error) {
    return null;
  }
};

// ✅ CLEAR AUTH DATA
export const clearAuthData = async () => {
  try {
    await SecureStore.deleteItemAsync("authToken");
    await SecureStore.deleteItemAsync("user");
  } catch (error) {
    console.log("Error clearing auth data:", error);
  }
};

export default apiClient;
