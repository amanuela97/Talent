import axios from 'axios';
import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // This is crucial for cookies to be sent/received
});

// Request interceptor to add auth token to each request
axiosInstance.interceptors.request.use(
  async (config) => {
    const session = await getSession();
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session?.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiration
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle token refresh logic here if needed
    return Promise.reject(error);
  }
);

export default axiosInstance;
