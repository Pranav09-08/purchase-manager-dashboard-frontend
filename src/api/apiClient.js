// Centralized API client for HTTP requests
import axios from 'axios';
import { auth } from '../config/firebase';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token automatically
apiClient.interceptors.request.use(
  async (config) => {
    // If Authorization header is already set, validate it
    if (config.headers.Authorization) {
      const token = config.headers.Authorization.replace('Bearer ', '');
      
      // Check if token looks like a valid JWT (has 3 parts separated by dots)
      if (!token || token === 'undefined' || token === 'null' || token.split('.').length !== 3) {
        console.error('Invalid token format detected. Token:', token ? 'malformed' : 'undefined/null');
        
        // Try to get a fresh token from Firebase
        if (auth.currentUser) {
          try {
            console.log('Attempting to get fresh token from Firebase...');
            const freshToken = await auth.currentUser.getIdToken(true);
            console.log('Fresh token obtained successfully');
            config.headers.Authorization = `Bearer ${freshToken}`;
          } catch (error) {
            console.error('Failed to get fresh token:', error.message);
            throw new Error('Authentication token is invalid. Please log in again.');
          }
        } else {
          console.error('No authenticated user found in Firebase');
          throw new Error('No authenticated user found. Please log in.');
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Log detailed error information for debugging
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        console.warn('Authentication failed:', data?.error || 'Unauthorized');
      } else if (status === 404) {
        console.warn('Resource not found:', originalRequest.url);
      }
    }

    // Handle 401 Unauthorized - try to refresh token once
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (auth.currentUser) {
          const freshToken = await auth.currentUser.getIdToken(true);
          originalRequest.headers.Authorization = `Bearer ${freshToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError.message);
        // Only redirect to login if we're not already on the login page
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
