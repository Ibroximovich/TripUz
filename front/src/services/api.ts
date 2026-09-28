import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { refreshTokenApi, logoutApi } from './auth.api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// ─── Race Condition Guard ──────────────────────────────────────────────────────
// Ensures only ONE refresh request is in-flight at a time.
// All concurrent 401s wait for the same refresh promise.
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
}

// ─── Request Interceptor: Attach Access Token & Language ──────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Automatically remove default application/json header for FormData uploads
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }

    // Attach current language preference if available
    const lang = localStorage.getItem('tripuz_lang') || 'uz';
    if (config.headers) {
      config.headers['Accept-Language'] = lang;
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ─── Response Interceptor: Silent Refresh on 401 ──────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Only attempt refresh for 401 errors, and avoid infinite loops
    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Skip refresh for the /auth/refresh and /auth/logout endpoints themselves
    const url = originalRequest.url || '';
    if (url.includes('/auth/refresh') || url.includes('/auth/logout')) {
      return Promise.reject(error);
    }

    const { refreshToken } = useAuthStore.getState();

    if (!refreshToken) {
      // No refresh token available — logout immediately
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Another refresh is already in-flight — queue this request
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newAccessToken) => {
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        })
        .catch((queueError) => Promise.reject(queueError));
    }

    // Mark as refreshing and set retry flag
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const result = await refreshTokenApi({ refreshToken });

      if (result.success && result.data) {
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = result.data;

        // Update tokens in store (user stays logged in)
        useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);

        // Resolve all queued requests with the new access token
        processQueue(null, newAccessToken);

        // Retry the original request with the new token
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } else {
        throw new Error('Refresh failed');
      }
    } catch (refreshError) {
      // Refresh failed — logout user
      processQueue(refreshError, null);
      const currentRefreshToken = useAuthStore.getState().refreshToken;
      if (currentRefreshToken) {
        logoutApi(currentRefreshToken); // fire-and-forget server revoke
      }
      useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
