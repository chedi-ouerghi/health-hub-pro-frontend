import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../../stores/auth-store";
import { ApiError, type ApiResponse, type PaginatedResponse } from "../../types/api.types";
import type { AuthResponse } from "../../types/auth.types";

const API_URL =
  (import.meta.env["VITE_API_URL"] as string | undefined) || "http://localhost:5000/api/v1";

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request Interceptor: Attach Bearer Token ───────────────────────────────────

let isRefreshing = false;
let refreshFailed = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      refreshFailed = false;
      if (config.headers) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor: Auto Refresh on 401 ──────────────────────────────────

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and request hasn't been retried yet
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !refreshFailed &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest.url?.includes("/auth/login")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject: (err: unknown) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt token rotation. The refresh token is sent in the body when
        // available; otherwise the backend falls back to the httpOnly
        // refresh_token cookie set on login.
        const refreshToken = useAuthStore.getState().refreshToken ?? undefined;
        const refreshResponse = await axios.post<ApiResponse<AuthResponse>>(
          `${API_URL}/auth/refresh`,
          { refreshToken },
          { withCredentials: true },
        );

        const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data.data;
        useAuthStore.getState().setTokens(accessToken, newRefreshToken);
        refreshFailed = false;

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        return apiClient(originalRequest);
      } catch (refreshErr) {
        refreshFailed = true;
        processQueue(refreshErr, null);
        useAuthStore.getState().clearSession();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // Format error response as ApiError if possible
    if (error.response?.data) {
      const errData = error.response.data;
      throw new ApiError(
        errData.statusCode || error.response.status || 500,
        errData.message || error.message || "An error occurred",
        errData.code,
        errData.path,
        errData.timestamp,
      );
    }

    throw new ApiError(error.response?.status || 500, error.message || "Network error");
  },
);

// ── Response Unwrapper Helper ──────────────────────────────────────────────────

/**
 * Extracts .data.data from NestJS ApiResponse envelope and handles errors.
 */
export function unwrap<T>(response: AxiosResponse<ApiResponse<T>>): T {
  const body = response.data;
  if (!body.success && body.success !== undefined) {
    throw new ApiError(500, "Request unsuccessful");
  }
  return body.data;
}

/**
 * Extracts .data.data and .data.meta for paginated endpoints.
 */
export function unwrapPaginated<T>(
  response: AxiosResponse<ApiResponse<T[]>>,
): PaginatedResponse<T> {
  const body = response.data;
  if (!body.success && body.success !== undefined) {
    throw new ApiError(500, "Request unsuccessful");
  }
  return {
    data: body.data,
    meta: body.meta || { total: body.data.length, page: 1, limit: body.data.length, totalPages: 1 },
  };
}
