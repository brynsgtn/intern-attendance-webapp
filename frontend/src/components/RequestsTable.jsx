import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { formatDate } from "../utils/date";
import { formatTime } from "../utils/time";
import { useAttendanceStore } from "../store/attendanceStore";
import { motion } from "framer-motion";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import { SearchX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast"

// Initialize plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const RequestsTable = ({ refreshKey }) => {
    const { isDarkMode, isLoading, user } = useAuthStore();
    const { fetchAllRequests, approveRequest, rejectRequest } = useAttendanceStore();
    const [currentPage, setCurrentPage] = useState(1);
    const [editRequests, setEditRequests] = useState([]);
    const rowsPerPage = 5;
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [nameFilter, setNameFilter] = useState("");
    const [teamFilter, setTeamFilter] = useState("");
    const [rejectionReason, setRejectionReason] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEditRequests = async () => {
            if (!user._id || !user.isAdmin) {
                console.error("User is not authorized or ID is not available");
                return;
            }

            try {
                console.log("Fetching edit requests as admin");
                const response = await fetchAllRequests();
                console.log("API Response:", response);

                if (response && response.data && response.data.edit_requests) {
                    console.log("Edit Requests Data:", response.data.edit_requests);
                    setEditRequests(response.data.edit_requests);
                } else {
                    console.error("Edit requests data not found in response");
                }
            } catch (error) {
                console.error("Error fetching edit requests:", error);
            }
        };
        
        setCurrentPage(1);
        fetchEditRequests();
    }, [user._id, refreshKey, fetchAllRequests]);

    const handleViewOpenModal = (request) => {
        setSelectedRequest(request);
        setIsViewModalOpen(true);
    };

    const handleViewCloseModal = () => {
        setIsViewModalOpen(false);
        setSelectedRequest(null);
    };

    const handleApproveRequest = async (userId) => {
      const { created_at } = selectedRequest;
      const date = dayjs(created_at).format("YYYY-MM-DD");
      
      try {
        await approveRequest(date, userId);
        toast.success("Request approved!")
        handleViewCloseModal(); // Close the modal after successful approval
        navigate('/dashboard');
      } catch (error) {
        console.error("Error approving request:", error);
        toast.error("Failed to approve request");
      }
    };

    const handleRejectRequest = async () => {
      const { created_at } = selectedRequest;
      const date = dayjs(created_at).format("YYYY-MM-DD");
 
      
      try {
        await rejectRequest(date, rejectionReason, selectedRequest.user._id);
        toast.success("Request rejected!");
        handleViewCloseModal(); // Close the modal after successful rejection
        navigate('/dashboard');
      } catch (error) {
        console.error("Error rejecting request:", error);
        toast.error("Failed to reject request");
      }
    };

    // Apply all filters to the data
    const filteredRequests = editRequests.filter((request) => {
        // Date filter - check if the created_at date matches the selected date
        const matchesDate = selectedDate
            ? dayjs(request.created_at).format("YYYY-MM-DD") === selectedDate
            : true;
        
        // Name filter - check if the user's full name includes the name filter
        const matchesName = nameFilter
            ? request.user.full_name.toLowerCase().includes(nameFilter.toLowerCase())
            : true;
        
        // Team filter - check if the user's team matches the team filter
        const matchesTeam = teamFilter
            ? request.user.team === teamFilter
            : true;
        
        return matchesDate && matchesName && matchesTeam;
    });

    if (isLoading) {
        return <div className="text-center py-4">Loading...</div>;
    }

    if (!user.isAdmin) {
        return (
            <div className={`flex justify-center items-center ${isDarkMode ? "bg-gray-900" : "bg-white"} p-4 min-h-[200px]`}>
                <div className="text-lg text-red-500">
                    You do not have permission to view this page.
                </div>
            </div>
        );
    }

    if (!Array.isArray(filteredRequests) || filteredRequests.length === 0) {
        return (
            <>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
                    {/* Filter by Date */}
                    <div>
                        <label className="text-sm font-medium mr-2">Filter by Date:</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className={`border rounded px-2 py-1 ${isDarkMode ? "bg-gray-800 text-white border-gray-600" : "bg-white text-black border-gray-300"}`}
                        />
                        {selectedDate && (
                            <button
                                onClick={() => setSelectedDate('')}
                                className="ml-2 text-sm text-blue-500 hover:cursor-pointer"
                            >
                                <SearchX size={20} />
                            </button>
                        )}
                    </div>

                    {/* Filter by Name */}
                    <div>
                        <label className="text-sm font-medium mr-2">Filter by Name:</label>
                        <input
                            type="text"
                            placeholder="Enter name"
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                            className={`border rounded px-2 py-1 ${isDarkMode ? "bg-gray-800 text-white border-gray-600" : "bg-white text-black border-gray-300"}`}
                        />
                    </div>

                    {/* Filter by Team */}
                    <div>
                        <label className="text-sm font-medium mr-2">Filter by Team:</label>
                        <select
                            value={teamFilter}
                            onChange={(e) => setTeamFilter(e.target.value)}
                            className={`border rounded px-2 py-1 ${isDarkMode ? "bg-gray-800 text-white border-gray-600" : "bg-white text-black border-gray-300"}`}
                        >
                            <option value="">All Teams</option>
                            {Array.from(new Set(editRequests.map((req) => req.user.team)))
                                .filter(Boolean)
                                .map((team) => (
                                    <option key={team} value={team}>
                                        {team}
                                    </option>
                                ))}
                        </select>
                    </div>
                </div>
                <div className={`flex justify-center items-center ${isDarkMode ? "bg-gray-900" : "bg-white"} p-4 min-h-[200px]`}>
                    <div className="text-lg text-gray-500">
                        No edit requests found.
                    </div>
                </div>
            </>
        );
    }

    const totalPages = Math.ceil(filteredRequests.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentRequests = filteredRequests.slice(startIndex, startIndex + rowsPerPage);

    return (
        <>
            <div className={`overflow-x-auto ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"} p-4 rounded-lg`}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
                    {/* Filter by Date */}
                    <div>
                        <label className="text-sm font-medium mr-2">Filter by Date:</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className={`border rounded px-2 py-1 ${isDarkMode ? "bg-gray-800 text-white border-gray-600" : "bg-white text-black border-gray-300"}`}
                        />
                        {selectedDate && (
                            <button
                                onClick={() => setSelectedDate('')}
                                className="ml-2 text-sm text-blue-500 hover:cursor-pointer"
                            >
                                <SearchX size={20} />
                            </button>
                        )}
                    </div>

                    {/* Filter by Name */}
                    <div>
                        <label className="text-sm font-medium mr-2">Filter by Name:</label>
                        <input
                            type="text"
                            placeholder="Enter name"
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                            className={`border rounded px-2 py-1 ${isDarkMode ? "bg-gray-800 text-white border-gray-600" : "bg-white text-black border-gray-300"}`}
                        />
                    </div>

                    {/* Filter by Team */}
                    <div>
                        <label className="text-sm font-medium mr-2">Filter by Team:</label>
                        <select
                            value={teamFilter}
                            onChange={(e) => setTeamFilter(e.target.value)}
                            className={`border rounded px-2 py-1 ${isDarkMode ? "bg-gray-800 text-white border-gray-600" : "bg-white text-black border-gray-300"}`}
                        >
                            <option value="">All Teams</option>
                            {Array.from(new Set(editRequests.map((req) => req.user.team)))
                                .filter(Boolean)
                                .map((team) => (
                                    <option key={team} value={team}>
                                        {team}
                                    </option>
                                ))}
                        </select>
                    </div>
                </div>

                <table className={`min-w-full ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
                    <thead className={isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-50 text-gray-500"}>
                        <tr>
                            {["Name", "Team", "Requested Time In", "Requested Time Out", "Requested Date", "Action"].map((header) => (
                                <th key={header} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className={isDarkMode ? "bg-gray-800 divide-gray-700" : "bg-white divide-gray-200"}>
                        {currentRequests.map((request) => (
                            <motion.tr
                                key={request._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                                className={`hover:text-white transition ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                            >
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {request.user.full_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {request.user.team}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {request.pending_time_in ? formatTime(request.pending_time_in) : 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {request.pending_time_out ? formatTime(request.pending_time_out) : 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {formatDate(request.created_at)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <button
                                        onClick={() => handleViewOpenModal(request)}
                                        className="text-blue-400 hover:text-white hover:cursor-pointer"
                                    >
                                        View Details
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>

                {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4">
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className={`px-4 py-2 text-sm font-medium rounded-md ${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"} ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-400"}`}
                        >
                            Previous
                        </button>

                        <span className="text-sm">
                            Page {currentPage} of {totalPages}
                        </span>

                        <button
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className={`px-4 py-2 text-sm font-medium rounded-md ${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"} ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-400"}`}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            <RequestModal
                isOpen={isViewModalOpen}
                onClose={handleViewCloseModal}
                request={selectedRequest}
                isDarkMode={isDarkMode}
                approveRequest={handleApproveRequest}
                rejectRequest={handleRejectRequest}
                rejectionReason={rejectionReason}
                setRejectionReason={setRejectionReason}
            />
        </>
    );
};

export default RequestsTable;

const RequestModal = ({ isOpen, onClose, request, isDarkMode, approveRequest, rejectRequest, rejectionReason, setRejectionReason}) => {


    if (!isOpen || !request) return null;

    const handleReject = () => {
      const date = dayjs(request.created_at).format("YYYY-MM-DD");
      rejectRequest(date, rejectionReason, request.user._id);
  };


    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-lg">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className={`p-6 rounded-2xl w-full max-w-lg shadow-xl border ${isDarkMode ? "bg-gray-900 text-white border-gray-700" : "bg-white text-gray-900 border-gray-200"}`}
            >
                <h2 className="text-2xl font-semibold mb-4">Edit Request Details</h2>
                <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {request.user.full_name}</p>
                    <p><span className="font-medium">Email:</span> {request.user.email}</p>
                    <p><span className="font-medium">Team:</span> {request.user.team}</p>
                    <p><span className="font-medium">School:</span> {request.user.school}</p>
                    
                    <div className="mt-4 mb-2 border-t pt-4">
                        <h3 className="font-medium text-lg mb-2">Time Changes</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="font-medium">Original Time In:</p>
                                <p>{formatTime(request.original_time_in) || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="font-medium">Requested Time In:</p>
                                <p>{formatTime(request.pending_time_in) || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="font-medium">Original Time Out:</p>
                                <p>{formatTime(request.original_time_out) || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="font-medium">Requested Time Out:</p>
                                <p>{formatTime(request.pending_time_out) || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-4 pt-2">
                        <p className="font-medium">Request Reason:</p>
                        <p className={`mt-1 p-2 ${isDarkMode ? 'bg-gray-800' : 'dark:bg-gray-100'} rounded`}>
                            {request.request_reason || 'No reason provided'}
                        </p>
                    </div>
                    <p><span className="font-medium">Requested Date:</span> {formatDate(request.created_at)}</p>
                </div>

                <div className="mt-4 pt-2">
                    <p className="font-medium">Rejection Reason (optional):</p>
                    <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Enter reason for rejection"
                        className={`mt-1 p-2 w-full rounded border ${
                            isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-black'
                        }`}
                        rows="3"
                    />
                </div>

                <div className="mt-6 flex justify-between">
                    <div>
                        <button 
                            className="px-4 py-2 text-sm font-medium rounded-lg transition duration-200 
                            bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-400 focus:outline-none mr-2"
                            onClick={handleReject}
                        >
                            Reject
                        </button>
                        <button 
                            className="px-4 py-2 text-sm font-medium rounded-lg transition duration-200 
                            bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-400 focus:outline-none"
                            onClick={() => approveRequest(request.user._id)}
                        >
                            Approve
                        </button>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium rounded-lg transition duration-200 
                        bg-gray-600 text-white hover:bg-gray-700 focus:ring-2 focus:ring-gray-400 focus:outline-none"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    );
};