import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1";

/**
 * Flag to prevent multiple concurrent token refresh attempts
 */
let isRefreshing = false;

/**
 * Queue of requests waiting for token refresh to complete
 */
let refreshSubscribers: Array<(token: string) => void> = [];

/**
 * Add a request to the refresh queue
 * @param callback - Function to call with new token
 */
const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

/**
 * Notify all queued requests that token has been refreshed
 * @param token - New access token
 */
const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

/**
 * Dynamically import authService to avoid circular dependency
 * authService imports api, so we can't import authService at module level
 */
const getAuthService = async () => {
  const { refreshToken: refreshAccessToken } = await import("./authService");
  return { refreshAccessToken };
};

/**
 * Create axios instance with default configuration
 */
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request interceptor for adding auth token
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("access_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for handling errors and automatic token refresh
 */
api.interceptors.response.use(
  (response: any) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Skip auth for requests marked with skipAuth flag
    if (originalRequest?.skipAuth) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized - attempt token refresh
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");

      // If no refresh token, force logout
      if (!refreshToken) {
        localStorage.removeItem("access_token");
        window.location.href = "/";
        return Promise.reject(error);
      }

      try {
        // If already refreshing, queue the request
        if (isRefreshing) {
          return new Promise((resolve) => {
            subscribeTokenRefresh((token: string) => {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            });
          });
        }

        // Start refresh process
        isRefreshing = true;
        const { refreshAccessToken } = await getAuthService();
        const newToken = await refreshAccessToken(refreshToken);
        
        // Update the original request with new token
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken.access_token}`;

        // Notify all queued requests
        onTokenRefreshed(newToken.access_token);
        isRefreshing = false;

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - force logout
        isRefreshing = false;
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

/**
 * API Error types for consistent error handling
 */
export interface ApiError {
  message: string;
  detail?: string;
  status?: number;
}

/**
 * Parse API error response into consistent format
 */
export const parseApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string; message?: string }>;
    return {
      message: axiosError.response?.data?.detail || 
               axiosError.response?.data?.message || 
               axiosError.message || 
               "An unexpected error occurred",
      status: axiosError.response?.status,
    };
  }
  return {
    message: error instanceof Error ? error.message : "An unexpected error occurred",
  };
};
