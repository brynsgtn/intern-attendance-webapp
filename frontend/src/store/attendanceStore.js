import {create} from "zustand";
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
    requestEditAttendance: async (userId, date, time_in, time_out, request_reason ) => {
		try {
			const response = await axios.post(`${API_URL}/update-attendance/${userId}`, {date, time_in, time_out, request_reason})
            return response.data; 
		} catch (error) {
            console.error("Error requestEditAttendance:", error);
            throw error;
		}
	},
    getTeamMembersAttendance : async () => {
        try {
            const response = await axios.get(`${API_URL}/team-attendance`);
            console.log("Fetched Attendance Data:", response); // Log attendance
            return response;
        } catch (error) {
            console.error("Error fetching attendance:", error);
        }
    },
    getAllInternsAttendance : async () => {
        try {
            const response = await axios.get(`${API_URL}/get-all-attendance`);
            console.log("Fetched Attendance Data:", response); // Log attendance
            return response;
        } catch (error) {
            console.error("Error fetching attendance:", error);
        }
    },
    fetchAllRequests : async () => {
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
			const response = await axios.post(`${API_URL}/approve-attendance/${userId}`, {date})
            return response.data; 
		} catch (error) {
            console.error("Error in approveRequest:", error);
            throw error;
		}
	},
    rejectRequest: async (date, reason, userId) => {
        try {
          const response = await axios.post(`${API_URL}/reject-attendance/${userId}`, { date, reason });
          return response.data;
        } catch (error) {
          console.error("Error in rejectRequest:", error);
          throw error;
        }
      },
})
);

