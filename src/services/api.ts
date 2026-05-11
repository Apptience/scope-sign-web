import axios from "axios";

export const BASE_SERVER_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const api = axios.create({
  baseURL: `${BASE_SERVER_URL}/api/trpc`,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // If the server returned a tRPC error JSON, resolve it so our services can handle data.error cleanly
    if (error.response?.data) {
      console.log("[AXIOS_INTERCEPTOR] Unwrapping tRPC server response error:", error.response.data);
      return Promise.resolve({ data: error.response.data });
    }
    return Promise.reject(error);
  }
);
