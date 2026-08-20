import React, { createContext, useContext, useState, useEffect } from "react";
import API from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync session state on load
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      const cachedRole = localStorage.getItem("role");
      const cachedName = localStorage.getItem("name");

      if (token) {
        try {
          // Verify token by calling /users/me
          const response = await API.get("/users/me");
          setUser(response.data);
          
          // Refresh caches
          localStorage.setItem("role", response.data.role);
          localStorage.setItem("name", response.data.full_name);
        } catch (error) {
          // Token invalid, interceptor handles clearing
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await API.post("/auth/login", { email, password });
      const { access_token, user_role, user_name } = response.data;
      
      localStorage.setItem("token", access_token);
      localStorage.setItem("role", user_role);
      localStorage.setItem("name", user_name);
      
      // Fetch user profile
      const userProfile = await API.get("/users/me");
      setUser(userProfile.data);
      setLoading(false);
      return userProfile.data;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const register = async (email, password, fullName) => {
    setLoading(true);
    try {
      await API.post("/auth/register", {
        email,
        password,
        full_name: fullName,
      });
      setLoading(false);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
};
