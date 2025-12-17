
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { CustomAxiosRequestConfig } from "./axiosInstance.types";

// Default to local backend if EXPO_PUBLIC_SERVER_URI isn't set
const DEFAULT_API_URL = process.env.EXPO_PUBLIC_SERVER_URI || "http://192.168.100.34:8000";

const axiosInstance = axios.create({
  baseURL: DEFAULT_API_URL,
  withCredentials: true, // RN ignores cookies anyway — safe to keep
});

/* =====================================================
   TOKEN UTILITIES
===================================================== */

// Read token
const getAccessToken = async (): Promise<string | null> => {
  try {
    const token = await SecureStore.getItemAsync("authToken");
    return token;
  } catch (error) {
    return null;
  }
};

// Save token
export const storeAccessToken = async (token: string) => {
  try {
    await SecureStore.setItemAsync("authToken", token);
  } catch (error) {
  }
};

// Remove token
export const removeAccessToken = async () => {
  try {
    await SecureStore.deleteItemAsync("authToken");
  } catch (error) {
    console.error("Error deleting authToken:", error);
  }
};

// Logout cleanup
const handleLogout = async () => {
  await removeAccessToken();
  await SecureStore.deleteItemAsync("refresh_token");
  await SecureStore.deleteItemAsync("user");

  // OPTIONAL:
  // router.replace("/login");
};

/* =====================================================
   REFRESH TOKEN STATE
===================================================== */

let isRefreshing = false;
let refreshSubscribers: (() => void)[] = [];

const subscribeTokenRefresh = (cb: () => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshSuccess = () => {
  refreshSubscribers.forEach((cb) => cb());
  refreshSubscribers = [];
};

/* =====================================================
   REQUEST INTERCEPTOR ✅
===================================================== */

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* =====================================================
   RESPONSE INTERCEPTOR ✅
===================================================== */

axiosInstance.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    const is401 = error.response?.status === 401;
    const isRetry = originalRequest._retry;
    const hasAuthHeader =
      !!originalRequest.headers?.Authorization;

    // Try refresh only for protected requests
    if (is401 && !isRetry && hasAuthHeader) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh(() =>
            resolve(axiosInstance(originalRequest))
          );
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken =
          await SecureStore.getItemAsync("refresh_token");

        if (!refreshToken)
          throw new Error("No refresh token available");

        const res = await axios.post(
          `${process.env.EXPO_PUBLIC_SERVER_URI}/auth/api/refresh-token`,
          { refreshToken },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        );

        const newAccessToken = res.data?.accessToken;

        if (!newAccessToken)
          throw new Error("No new access token returned");

        await storeAccessToken(newAccessToken);

        isRefreshing = false;
        onRefreshSuccess();

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];

        await handleLogout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
