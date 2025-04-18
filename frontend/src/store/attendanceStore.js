import { create } from "zustand";
import axios from "axios";

const API_URL = "http://localhost:3000/api/attendance";


export const useAttendanceStore = create((set) => ({

    fetchUserAttendance: async (userId) => {
        try {
            const response = await axios.get(`${API_URL}/get-attendance/${userId}`);
            console.log("Fetched Attendance Data:", response); // Log attendance
            return response;
        } catch (error) {
            console.error("Error fetching attendance:", error);
        }
    },
    refreshAttendance: async (userId) => {
        await useAttendanceStore.getState().fetchUserAttendance(userId);
    },
    timeIn: async (userId) => {
        try {
            const response = await axios.post(`${API_URL}/time-in/${userId}`)
            return response.data;
        } catch (error) {
            console.error("Error in time in:", error);
            throw error;
        }
    },
    timeOut: async (userId) => {
        try {
            const response = await axios.post(`${API_URL}/time-out/${userId}`)
            return response.data;
        } catch (error) {
            console.error("Error in time in:", error);
            throw error;
        }
    },
    getTotalHours: async (userId) => {
        try {
            const response = await axios.get(`${API_URL}/get-total-hours/${userId}`);
            console.log("Fetched total hours:", response); // Log attendance
            return response;
        } catch (error) {
            console.error("Error total hours:", error);
        }
    },
    requestEditAttendance: async (userId, date, time_in, time_out, request_reason) => {
        try {
            const response = await axios.post(`${API_URL}/update-attendance/${userId}`, { date, time_in, time_out, request_reason })
            return response.data;
        } catch (error) {
            console.error("Error requestEditAttendance:", error);
            throw error;
        }
    },
    getTeamMembersAttendance: async () => {
        try {
            const response = await axios.get(`${API_URL}/team-attendance`);
            console.log("Fetched Attendance Data:", response); // Log attendance
            return response;
        } catch (error) {
            console.error("Error fetching attendance:", error);
        }
    },
    getAllInternsAttendance: async () => {
        try {
            const response = await axios.get(`${API_URL}/get-all-attendance`);
            console.log("Fetched Attendance Data:", response); // Log attendance
            return response;
        } catch (error) {
            console.error("Error fetching attendance:", error);
        }
    },
    fetchAllRequests: async () => {
        try {
            const response = await axios.get(`${API_URL}/edit-requests`);
            console.log("Fetched Attendance Data:", response); // Log attendance
            return response;
        } catch (error) {
            console.error("Error fetching attendance:", error);
        }
    },
    approveRequest: async (date, userId) => {
        try {
            const response = await axios.post(`${API_URL}/approve-attendance/${userId}`, { date })
            return response.data;
        } catch (error) {
            console.error("Error in approveRequest:", error);
            throw error;
        }
    },
    rejectRequest: async (date, reason, userId) => {
        try {
            const response = await axios.post(`${API_URL}/reject-attendance/${userId}`, { date, reason });
            return response;
        } catch (error) {
            console.error("Error in rejectRequest:", error);
            throw error;
        }
    },
    getInternRemainingHours: async (memberId) => {
        try {
            const response = await axios.get(`${API_URL}/member-remaining-hours/${memberId}`);
            console.log("Fetched Attendance Data:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error fetching intern's remaining hours:", error);
            throw error;
        }
    },
    deleteAttendance: async (attendanceId) => {
        try {
            set({ isLoading: true, error: null });
            
            const response = await axios.delete(`${API_URL}/delete-attendance/${attendanceId}`, {
                withCredentials: true // This is important to send cookies
            });
    
            set({ isLoading: false });
            return response.data;
        } catch (error) {
            set({ 
                isLoading: false, 
                error: error.response?.data?.message || "Error deleting attendance record" 
            });
            throw error;
        }
    },
    createAttendanceForDate: async (userId, date, time_in, time_out, request_reason) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.post(
                `${API_URL}/create-attendance/${userId}`,
                { date, time_in, time_out, request_reason }
            );
            
            // Add the new attendance record to the state
            set(state => ({
                attendanceData: [response.data.attendance, ...state.attendanceData],
                loading: false
            }));
            
            return {
                success: true,
                data: response.data,
                message: response.data.message
            };
        } catch (error) {
            set({ 
                error: error.response?.data?.message || 'Failed to create attendance record', 
                loading: false 
            });
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to create attendance record'
            };
        }
    },
})
);

