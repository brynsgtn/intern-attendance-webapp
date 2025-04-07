import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { formatDate } from "../utils/date";
import { formatTime } from "../utils/time";
import { useAttendanceStore } from "../store/attendanceStore";
import { motion } from "framer-motion";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

// Initialize plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const UserTable = ({ refreshKey }) => {
    const { isDarkMode, isLoading, user } = useAuthStore();
    const { fetchUserAttendance, requestEditAttendance } = useAttendanceStore();
    const [currentPage, setCurrentPage] = useState(1);
    const [userAttendance, setUserAttendance] = useState([]);
    const rowsPerPage = 5;
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);

    useEffect(() => {
        const getAttendance = async () => {
            if (!user._id) {
                console.error("User ID is not available");
                return;
            }

            try {
                console.log("Fetching attendance for user ID:", user._id);
                const response = await fetchUserAttendance(user._id);
                console.log("API Response:", response);

                if (response && response.data && response.data.attendance) {
                    console.log("Attendance Data:", response.data.attendance);
                    setUserAttendance(response.data.attendance);
                } else {
                    console.error("Attendance data not found in response");
                }
            } catch (error) {
                console.error("Error fetching attendance data:", error);
            }
        };

        getAttendance();
    }, [user._id, refreshKey, fetchUserAttendance]);

    const handleViewOpenModal = (record) => {
        setSelectedRecord(record);
        setIsViewModalOpen(true);
    };

    const handleViewCloseModal = () => {
        setIsViewModalOpen(false);
        setSelectedRecord(null);
    };

    const handleEditOpenModal = (record) => {
        setSelectedRecord(record);
        setIsEditModalOpen(true);
    };

    const handleEditCloseModal = () => {
        setIsEditModalOpen(false);
        setSelectedRecord(null);
    };

    const handleSaveEdit = async (editedRecord) => {

        try {
            console.log("Saving edited record:", editedRecord);
            const response = await requestEditAttendance(
                user._id,
                editedRecord.date,
                editedRecord.time_in,
                editedRecord.time_out,
                editedRecord.request_reason
            ); // API call to update attendance record

            if (response) {
                console.log("Record updated:", response);
                // Update the local state with the updated record
                setUserAttendance(prevAttendance =>
                    prevAttendance.map(record =>
                        record._id === editedRecord._id ? response : record
                    )
                );
            } else {
                console.error("Error updating record:", response);
            }
        } catch (error) {
            console.error("Error saving edited record:", error.message);
            // Add this to see the detailed error response
            if (error.response && error.response.data) {
                console.error("Error details:", error.response.data);
            }
        }
    };


    if (isLoading) {
        return (
            <div className={`flex justify-center items-center ${isDarkMode ? "bg-gray-900" : "bg-white"} p-4`}>
                <div className="text-lg text-gray-500">
                    Loading attendance data...
                </div>
            </div>
        );
    }

    if (!Array.isArray(userAttendance) || userAttendance.length === 0) {
        return (
            <div className={`flex justify-center items-center ${isDarkMode ? "bg-gray-900" : "bg-white"} p-4`}>
                <div className="text-lg text-gray-500">
                    No attendance records found.
                </div>
            </div>
        );
    }

    const totalPages = Math.ceil(userAttendance.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentRecords = userAttendance.slice(startIndex, startIndex + rowsPerPage);

    return (
        <>
            <div className={`overflow-x-auto ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"} p-4 rounded-lg`}>
                <table className={`min-w-full ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
                    <thead className={isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-50 text-gray-500"}>
                        <tr>
                            {["Date", "Time In", "Time Out", "Hours", "Status", "Action"].map((header) => (
                                <th key={header} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className={isDarkMode ? "bg-gray-800 divide-gray-700" : "bg-white divide-gray-200"}>
                        {currentRecords.map((record, index) => (
                            <tr key={index} className={`hover:text-white transition ${isDarkMode ? "border-gray-700 hover:bg-emerald-600" : "border-gray-200 hover:bg-blue-500"}`}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(record.time_in)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{formatTime(record.time_in)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {record.time_out == null ? 'no time-out' : formatTime(record.time_out)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span>
                                        {isNaN(parseFloat(record.total_hours))
                                            ? "N/A"
                                            : parseFloat(record.total_hours).toFixed(2) + " hrs"
                                        }
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 py-1 rounded-md 
                                    ${record.status === "Incomplete" ? "bg-yellow-500 text-white"
                                            : record.status === "pending" ? "bg-gray-400 text-white"
                                                : record.status === "approved" ? "bg-green-500 text-white"
                                                    : record.status === "completed" ? "bg-blue-500 text-white"
                                                        : "bg-red-500 text-white"}`}>
                                        {record.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <button
                                        onClick={() => handleViewOpenModal(record)}
                                        className="text-blue-400 hover:text-white hover:cursor-pointer"
                                    >View Details</button>
                                </td>
                            </tr>
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
                onEditClick={handleEditOpenModal}
                record={selectedRecord}
                isDarkMode={isDarkMode}
            />

            <EditModal
                isOpen={isEditModalOpen}
                onClose={handleEditCloseModal}
                record={selectedRecord}
                isDarkMode={isDarkMode}
                onSave={handleSaveEdit}
            />
        </>
    );
};

export default UserTable;

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
                    <p><span className="font-medium">Date:</span> {formatDate(record.time_in)}</p>
                    <p><span className="font-medium">Time In:</span> {formatTime(record.time_in)}</p>
                    <p><span className="font-medium">Time Out:</span> {record.time_out ? formatTime(record.time_out) : 'N/A'}</p>
                    <p><span className="font-medium">Hours:</span> {record.total_hours ? `${parseFloat(record.total_hours).toFixed(2)} hrs` : 'N/A'}</p>
                    <p><span className="font-medium">Status:</span> {record.status}</p>
                    { record.status == 'pending' ? <p><span className="font-medium">Request Reason:</span> {record.request_reason}</p> : ''}
                    { record.status == 'rejected' ? <p><span className="font-medium">Reject Reason:</span> {record.rejection_reason}</p> : ''}
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={() => {
                            onClose();  // First close this modal
                            onEditClick(record);  // Then open the edit modal
                        }}
                        className="px-4 py-2 text-sm font-medium rounded-lg transition duration-200 
                        bg-gray-600 text-white hover:bg-gray-700 focus:ring-2 focus:ring-gray-400 focus:outline-none"
                    >
                        Request Edit
                    </button>

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

const EditModal = ({ isOpen, onClose, record, isDarkMode, onSave }) => {
    const [editedRecord, setEditedRecord] = useState(record || {});

    useEffect(() => {
        setEditedRecord(record || {});
    }, [record]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditedRecord((prev) => ({
            ...prev,
            [name]: value,
        }));
        console.log(`${name} changed to:`, value);  // Log the changes
    };

    const handleDateChange = (e) => {
        // Prevent changing the date field (i.e., don't modify the `date` in the state)
        console.log("Date field is disabled and cannot be changed");
    };

    const handleTimeChange = (e) => {
        const { name, value } = e.target;
        const [hours, minutes] = value.split(":");

        const dateField = name === "time_in_value" ? "time_in" : "time_out";

        setEditedRecord((prev) => {
            const existingDate = prev[dateField]
                ? new Date(prev[dateField])
                : new Date(prev.date || new Date());

                  // Check if existingDate is valid
        if (isNaN(existingDate.getTime())) {
            console.error("Invalid date:", prev[dateField], "Falling back to current date.");
            existingDate.setTime(Date.now()); // Fallback to current date if invalid
        }


            existingDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);

            console.log(`${dateField} updated to:`, existingDate.toISOString());

            return { ...prev, [dateField]: existingDate.toISOString() };
        });
    };


    const handleSave = () => {
        // Convert date and time_in to Manila time
        const manilaTimeIn = dayjs(`${editedRecord.time_in}`).tz('Asia/Manila', true); // Convert to Manila time
        const manilaTimeOut = dayjs(`${editedRecord.time_out}`).tz('Asia/Manila', true); // Convert to Manila time

        // Prepare the request body with the desired format
        const requestBody = {
            date: manilaTimeIn.isValid() ? manilaTimeIn.format('YYYY-MM-DD') : '', // Format the date in YYYY-MM-DD format
            time_in: manilaTimeIn.isValid() ? manilaTimeIn.format('HH:mm') : '', // Format the time in HH:mm format
            time_out: manilaTimeOut.isValid() ? manilaTimeOut.format('HH:mm') : '', // Format the time in HH:mm format
            request_reason: editedRecord.request_reason || '',
        };

        console.log("Request body to save:", requestBody);

        if (onSave) {
            onSave(requestBody);  // Pass the formatted data to the parent
        }
        onClose();
    };


    if (!isOpen) return null;

    const isValidDate = (dateString) => {
        if (!dateString) return false;
        const date = new Date(dateString);
        return !isNaN(date.getTime());
    };

    const formatDateForInput = (dateString) => {
        if (!isValidDate(dateString)) return "";
        return new Date(dateString).toISOString().slice(0, 10);
    };

    const formatTimeForInput = (dateString) => {
        if (!isValidDate(dateString)) return "";

        const date = new Date(dateString);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${hours}:${minutes}`;
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className={`p-6 rounded-lg w-full max-w-md shadow-lg ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}
            >
                <h2 className="text-xl font-semibold mb-4">Edit Attendance Details</h2>

                {/* Date field is shown but not editable */}
                <div className="mb-4">
                    <label htmlFor="date" className="block font-medium">Date:</label>
                    <input
                        type="date"
                        id="date"
                        name="date"
                        value={formatDateForInput(editedRecord.time_in)}
                        onChange={handleDateChange}  // Disabled change
                        disabled // Make it readonly
                        className={`w-full p-2 mt-1 rounded-md ${isDarkMode ? "bg-gray-700 border-gray-600" : "border-gray-300"} shadow-sm`}
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="timeIn" className="block font-medium">Time In:</label>
                    <input
                        type="time"
                        id="timeIn"
                        name="time_in_value"
                        value={formatTimeForInput(editedRecord.time_in)}
                        onChange={handleTimeChange}
                        className={`w-full p-2 mt-1 rounded-md ${isDarkMode ? "bg-gray-700 border-gray-600" : "border-gray-300"} shadow-sm`}
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="timeOut" className="block font-medium">Time Out:</label>
                    <input
                        type="time"
                        id="timeOut"
                        name="time_out_value"
                        value={formatTimeForInput(editedRecord.time_out)}
                        onChange={handleTimeChange}
                        className={`w-full p-2 mt-1 rounded-md ${isDarkMode ? "bg-gray-700 border-gray-600" : "border-gray-300"} shadow-sm`}
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="request_reason" className="block font-medium">Request reason:</label>
                    <textarea
                        id="request_reason"
                        name="request_reason"
                        value={editedRecord.request_reason || ""}
                        onChange={handleChange}
                        rows="4"
                        className={`w-full p-2 mt-1 rounded-md ${isDarkMode ? "bg-gray-700 border-gray-600" : "border-gray-300"} shadow-sm resize-none`}
                    />
                </div>

                <div className="mt-4 flex justify-end space-x-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        Save
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
