import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

const API_URL = "http://localhost:3000/api/auth";

axios.defaults.withCredentials = true;

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      error: null,
      isLoading: false,
      isCheckingAuth: true,
      message: null,
      isDarkMode: false,

      // Toggle Dark Mode
      darkmode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

      // User Authentication Actions
      signup: async (first_name, middle_initial, last_name, email, password, school, required_hours, team) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${API_URL}/signup`, { first_name, middle_initial, last_name, email, password, school, required_hours, team });
          set({ user: response.data.user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ error: error.response?.data?.message || "Error signing up", isLoading: false });
          throw error;
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${API_URL}/login`, { email, password });
          set({
            isAuthenticated: true,
            user: response.data.user,
            error: null,
            isLoading: false,
          });
        } catch (error) {
          set({ error: error.response?.data?.message || "Error logging in", isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          await axios.post(`${API_URL}/logout`);
          set({ user: null, isAuthenticated: false, error: null, isLoading: false });
        } catch (error) {
          set({ error: "Error logging out", isLoading: false });
          throw error;
        }
      },

      checkAuth: async () => {
        set({ isCheckingAuth: true, error: null });
        try {
          const response = await axios.get(`${API_URL}/check-auth`);
          set({ user: response.data.user, isAuthenticated: true, isCheckingAuth: false });
        } catch (error) {
          set({ error: null, isCheckingAuth: false, isAuthenticated: false });
        }
      },

      verifyEmail: async (code) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${API_URL}/verify-email`, { code });
          set({ user: response.data.user, isAuthenticated: true, isLoading: false });
          return response.data;
        } catch (error) {
          set({ error: error.response?.data?.message || "Error verifying email", isLoading: false });
          throw error;
        }
      },

      forgotPassword: async (email) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${API_URL}/forgot-password`, { email });
          set({ message: response.data.message, isLoading: false });
        } catch (error) {
          set({ error: error.response?.data?.message || "Error sending reset password email", isLoading: false });
          throw error;
        }
      },

      resetPassword: async (token, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${API_URL}/reset-password/${token}`, { password });
          set({ message: response.data.message, isLoading: false });
        } catch (error) {
          set({ error: error.response?.data?.message || "Error resetting password", isLoading: false });
          throw error;
        }
      },

      resendVerificationEmail: async (email) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${API_URL}/resend-verification-email`, { email });
          set({ message: response.data.message, isLoading: false });
        } catch (error) {
          set({ error: error.response?.data?.message || "Error resending verification email", isLoading: false });
          throw error;
        }
      },

      clearError: () => set({ error: null }),

      // User Profile Update
      editUserProfile: async (formData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.put(`${API_URL}/update-user-profile`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            withCredentials: true,
          });

          const updatedUser = response.data;

          if (!updatedUser || !updatedUser._id) {
            throw new Error("Invalid user data received from API");
          }

          set((state) => ({
            user: { ...state.user, ...updatedUser },
            error: null,
            isLoading: false,
          }));

          return updatedUser;
        } catch (error) {
          set({ error: error.response?.data?.message || "Error updating profile", isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: "auth-storage", // Key for localStorage
      getStorage: () => localStorage, // Use localStorage to persist data
    }
  )
);
