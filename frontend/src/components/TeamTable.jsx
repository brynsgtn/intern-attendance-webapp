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

// Initialize plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const TeamTable = ({ refreshKey }) => {
    const { isDarkMode, isLoading, user } = useAuthStore();
    const { getTeamMembersAttendance } = useAttendanceStore();
    const [currentPage, setCurrentPage] = useState(1);
    const [teamAttendance, setTeamAttendance] = useState([]);
    const rowsPerPage = 5;
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');


    useEffect(() => {
        const getAttendance = async () => {
            if (!user._id) {
                console.error("User ID is not available");
                return;
            }

            try {
                console.log("Fetching attendance for user ID:", user._id);
                const response = await getTeamMembersAttendance(user._id);
                console.log("API Response:", response);

                if (response && response.data && response.data.attendance) {
                    console.log("Attendance Data:", response.data.attendance);
                    setTeamAttendance(response.data.attendance);
                } else {
                    console.error("Attendance data not found in response");
                }
            } catch (error) {
                console.error("Error fetching attendance data:", error);
            }
        };
        setCurrentPage(1);

        getAttendance();
    }, [user._id, refreshKey, getTeamMembersAttendance], selectedDate);

    const handleViewOpenModal = (record) => {
        setSelectedRecord(record);
        setIsViewModalOpen(true);
    };

    const handleViewCloseModal = () => {
        setIsViewModalOpen(false);
        setSelectedRecord(null);
    };



    const filteredAttendance = selectedDate
        ? teamAttendance.filter((record) =>
            dayjs(record.time_in).format('YYYY-MM-DD') === selectedDate
        )
        : teamAttendance;

    if (isLoading) {
        return <div className="text-center py-4">Loading...</div>;
    }

    if (!Array.isArray(filteredAttendance) || filteredAttendance.length === 0) {
        return (
            <>
                <div className="mb-4">
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
                <div className={`flex justify-center items-center ${isDarkMode ? "bg-gray-900" : "bg-white"} p-4 min-h-[200px]`}>
                    <div className="text-lg text-gray-500">
                        No attendance records found.
                    </div>
                </div>
            </>

        );
    }


    const totalPages = Math.ceil(filteredAttendance.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentRecords = filteredAttendance.slice(startIndex, startIndex + rowsPerPage);


    return (
        <>
            <div className={`overflow-x-auto ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"} p-4 rounded-lg`}>
                <div className="mb-4">
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


                <table className={`min-w-full ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
                    <thead className={isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-50 text-gray-500"}>
                        <tr>
                            {["Name", "Date", "Time In", "Time Out", "Team", "Action"].map((header) => (
                                <th key={header} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className={isDarkMode ? "bg-gray-800 divide-gray-700" : "bg-white divide-gray-200"}>
                        {currentRecords.map((record, index) => (
                            <motion.tr
                                key={record._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                                className={`hover:text-white transition ${isDarkMode ? "..." : "..."}`}
                            >
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {record.user.full_name ?? "N/A"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {formatDate(record.time_in)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {formatTime(record.time_in)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {record.time_out == null ? 'no time-out' : formatTime(record.time_out)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {record.user.team}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <button
                                        onClick={() => handleViewOpenModal(record)}
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

            <Modal
                isOpen={isViewModalOpen}
                onClose={handleViewCloseModal}
                record={selectedRecord}
                isDarkMode={isDarkMode}
            />

        </>
    );
};

export default TeamTable;

const Modal = ({ isOpen, onClose, onEditClick, record, isDarkMode }) => {
    if (!isOpen || !record) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-lg">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className={`p-6 rounded-2xl w-full max-w-lg shadow-xl border ${isDarkMode ? "bg-gray-900 text-white border-gray-700" : "bg-white text-gray-900 border-gray-200"}`}
            >
                <h2 className="text-2xl font-semibold mb-4">Attendance Details</h2>
                <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {record.user.full_name}</p>
                    <p><span className="font-medium">Date:</span> {formatDate(record.time_in)}</p>
                    <p><span className="font-medium">Time In:</span> {formatTime(record.time_in)}</p>
                    <p><span className="font-medium">Time Out:</span> {record.time_out ? formatTime(record.time_out) : 'N/A'}</p>
                    <p><span className="font-medium">Hours:</span> {record.total_hours ? `${parseFloat(record.total_hours).toFixed(2)} hrs` : 'N/A'}</p>
                    <p><span className="font-medium">Status:</span> {record.status}</p>
                    <p><span className="font-medium">Reason:</span> {record.request_reason}</p>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
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
