import axios from "axios";
import toast from "react-hot-toast";

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return "http://localhost:8000/api/v1";
    }
    return `${origin}/api/v1`;
  }
  return "/api/v1";
};

const API = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach bearer tokens
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Manage session state & exception popups
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : null;
    const detail = error.response?.data?.detail;
    
    let message = "An unexpected error occurred.";
    if (typeof detail === "string") {
      message = detail;
    } else if (typeof detail === "object" && detail.message) {
      message = detail.message;
    } else if (error.message) {
      message = error.message;
    }

    if (status === 401) {
      // Clear invalid credentials and trigger refresh to trigger route protection redirections
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("name");
      
      // Avoid spamming alerts for login pages
      if (!window.location.pathname.includes("/login")) {
        toast.error("Session expired. Please log in again.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      }
    } else if (status === 403) {
      toast.error("Access Denied: You do not have permissions for this action.");
    } else {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

export default API;
