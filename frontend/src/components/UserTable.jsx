import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { formatDate } from "../utils/date";
import { formatTime } from "../utils/time";
import { useAttendanceStore } from "../store/attendanceStore";
import { motion } from "framer-motion";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import { AlarmClockPlusIcon } from "lucide-react";
import * as XLSX from 'xlsx'


// Initialize plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const UserTable = ({ refreshKey }) => {
    const { isDarkMode, isLoading, user } = useAuthStore();
    const {
        fetchUserAttendance,
        requestEditAttendance,
        deleteAttendance,
        createAttendanceForDate
    } = useAttendanceStore();

    const [currentPage, setCurrentPage] = useState(1);
    const [userAttendance, setUserAttendance] = useState([]);
    const rowsPerPage = 5;
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [statusMessage, setStatusMessage] = useState({ message: "", type: "" });

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
                    response.data.attendance.forEach(record => {
                        console.log(`Record ID: ${record._id}, Total Hours: ${record.total_hours}`);
                    });
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

    // Function to handle opening the create attendance modal
    const handleCreateOpenModal = () => {
        setIsCreateModalOpen(true);
    };

    // Function to handle closing the create attendance modal
    const handleCreateCloseModal = () => {
        setIsCreateModalOpen(false);
    };

    const handleCreateAttendance = async (formData) => {
        try {
            console.log("Submitting attendance data:", formData);

            // Send the data as it is - the backend expects separate date and time strings
            const response = await createAttendanceForDate(
                user._id,
                formData.date,
                formData.time_in,
                formData.time_out,
                formData.request_reason
            );

            if (response.success) {
                // If successful, update the UI
                setStatusMessage({
                    message: "Attendance record created successfully!",
                    type: "success"
                });

                // Close the modal
                setIsCreateModalOpen(false);

                // Refresh the attendance list to show the new record
                const refreshResponse = await fetchUserAttendance(user._id);
                if (refreshResponse && refreshResponse.data && refreshResponse.data.attendance) {
                    setUserAttendance(refreshResponse.data.attendance);
                }

                // Show success message briefly
                setTimeout(() => {
                    setStatusMessage({ message: "", type: "" });
                }, 3000);
            } else {
                setStatusMessage({
                    message: response.message || "Failed to create attendance record",
                    type: "error"
                });
            }
        } catch (error) {
            console.error("Error creating attendance record:", error);
            setStatusMessage({
                message: error.response?.data?.message || "Error creating attendance record",
                type: "error"
            });
        }
    };

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

    const handleDeleteConfirmOpen = () => {
        setIsViewModalOpen(false); // Close the view modal
        setIsDeleteConfirmOpen(true); // Open the delete confirmation modal
    };

    const handleDeleteConfirmClose = () => {
        setIsDeleteConfirmOpen(false);
    };

    const handleDeleteRecord = async () => {
        if (!selectedRecord || !selectedRecord._id) {
            console.error("No record selected for deletion");
            return;
        }

        try {
            console.log("Deleting record with ID:", selectedRecord._id);
            const response = await deleteAttendance(selectedRecord._id);

            if (response) {
                console.log("Record deleted successfully:", response);
                // Update the local state by removing the deleted record
                setUserAttendance(prevAttendance =>
                    prevAttendance.filter(record => record._id !== selectedRecord._id)
                );

                setStatusMessage({
                    message: "Record deleted successfully",
                    type: "success"
                });

                // Clear status message after 3 seconds
                setTimeout(() => {
                    setStatusMessage({ message: "", type: "" });
                }, 3000);
            } else {
                console.error("Error deleting record: Response is undefined");
            }
        } catch (error) {
            console.error("Error deleting record:", error.message);
            if (error.response && error.response.data) {
                console.error("Error details:", error.response.data);
            }

            setStatusMessage({
                message: "Failed to delete record",
                type: "error"
            });
        } finally {
            setIsDeleteConfirmOpen(false);
            setSelectedRecord(null);
        }
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

                setStatusMessage({
                    message: "Record updated successfully",
                    type: "success"
                });

                // Clear status message after 3 seconds
                setTimeout(() => {
                    setStatusMessage({ message: "", type: "" });
                }, 3000);
            } else {
                console.error("Error updating record:", response);
            }
        } catch (error) {
            console.error("Error saving edited record:", error.message);
            // Add this to see the detailed error response
            if (error.response && error.response.data) {
                console.error("Error details:", error.response.data);
            }

            setStatusMessage({
                message: "Failed to update record",
                type: "error"
            });
        }
    };

    const calculateWorkHours = (timeIn, timeOut, isApproved) => {
        // Convert the time_in and time_out to local time
        const timeInLocal = dayjs(timeIn).local();
        const timeOutLocal = dayjs(timeOut).local();

        // Define the work day window
        const workStart = timeInLocal.set('hour', 9).set('minute', 0).set('second', 0); // 9 AM
        const workEnd = timeInLocal.set('hour', 18).set('minute', 0).set('second', 0);  // 6 PM

        // Adjust time_in and time_out to fit the work window
        const adjustedStart = timeInLocal.isBefore(workStart) ? workStart : timeInLocal;  // If before 9 AM, start at 9 AM
        const adjustedEnd = timeOutLocal.isAfter(workEnd) ? workEnd : timeOutLocal;  // If after 6 PM, end at 6 PM

        // Calculate the difference between adjusted start and end times in minutes
        const totalMinutes = adjustedEnd.diff(adjustedStart, 'minute');

        // If the time_in is after the work_end or time_out is before work_start, return 0
        if (totalMinutes <= 0) {
            return "N/A";  // If no valid working time, return N/A
        }

        // Convert minutes to hours
        let totalHours = totalMinutes / 60;

        // Apply lunch break deduction rules
        if (totalHours > 5) {
            totalHours -= 1; // Deduct 1 hour for lunch
            console.log('Debug after lunch deduction:', totalHours);
        } else if (totalHours > 4 && totalHours <= 5) {
            totalHours = 4; // Cap at 4 hours for 4-5 hour periods
            console.log('Debug capped at 4 hours');
        }

        // Check if the request was approved and if the time_out was after 6 PM
        if (isApproved === "approved" && timeOutLocal.isAfter(workEnd)) {
            // Add the extra time after 6 PM to the total hours
            const overtimeMinutes = timeOutLocal.diff(workEnd, 'minute');
            totalHours += overtimeMinutes / 60;  // Add overtime to the total hours
            return `${totalHours.toFixed(2)} hrs (including overtime)`;
        }

        return totalHours.toFixed(2) + " hrs";
    };

    // Function to export attendance data to Excel (.xlsx)
    const exportToExcel = () => {
        if (!userAttendance || userAttendance.length === 0) {
            setStatusMessage({
                message: "No data to export",
                type: "error"
            });
            setTimeout(() => {
                setStatusMessage({ message: "", type: "" });
            }, 3000);
            return;
        }

        try {
            // Calculate total hours
            let totalHoursValue = 0;
            userAttendance.forEach(record => {
                const hoursText = calculateWorkHours(record.time_in, record.time_out, record.status);
                const hoursNumber = parseFloat(hoursText);
                if (!isNaN(hoursNumber)) {
                    totalHoursValue += hoursNumber;
                }
            });

            // Calculate remaining hours
            const remainingHours = user.required_hours - totalHoursValue;

            // Create a new workbook
            const wb = XLSX.utils.book_new();

            // Create data for the worksheet
            const wsData = [
                ['Name', `${user.first_name} ${user.last_name}`],
                ['School', user.school],
                ['Required Hours', user.required_hours],
                ['Remaining Hours', remainingHours.toFixed(2)],
                [], // Empty row
                ['Date', 'Time In', 'Time Out', 'Hours'] // Headers for attendance data
            ];

            // Add attendance data rows
            userAttendance.forEach(record => {
                const date = formatDate(record.time_in);
                const timeIn = formatTime(record.time_in);
                const timeOut = record.time_out ? formatTime(record.time_out) : 'No time-out';
                let hours = calculateWorkHours(record.time_in, record.time_out, record.status);
                let hoursValue = parseFloat(hours);
                hours = isNaN(hoursValue) ? 'incomplete' : hoursValue.toFixed(2);
                wsData.push([date, timeIn, timeOut, hours]);

            });

            // Add total row
            wsData.push(['', '', 'Total', `${totalHoursValue.toFixed(2)} hrs`]);

            // Create a worksheet from the data
            const ws = XLSX.utils.aoa_to_sheet(wsData);

            // Add the worksheet to the workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Attendance');

            // Generate the Excel file as an array buffer
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

            // Convert the array buffer to a Blob
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

            // Create a download link and trigger the download
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            link.setAttribute('href', url);
            link.setAttribute('download', `${user.first_name}_${user.last_name}_attendance.xlsx`);
            link.style.visibility = 'hidden';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setStatusMessage({
                message: "Export successful!",
                type: "success"
            });
            setTimeout(() => {
                setStatusMessage({ message: "", type: "" });
            }, 3000);
        } catch (error) {
            console.error("Error exporting to Excel:", error);
            setStatusMessage({
                message: "Failed to export data",
                type: "error"
            });
            setTimeout(() => {
                setStatusMessage({ message: "", type: "" });
            }, 3000);
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

    return (
        <>
            {/* Status message display */}
            {statusMessage.message && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mb-4 p-3 rounded-md ${statusMessage.type === "success"
                        ? "bg-green-100 text-green-800 border border-green-200"
                        : "bg-red-100 text-red-800 border border-red-200"
                        }`}
                >
                    {statusMessage.message}
                </motion.div>
            )}

            {/* Add Export and Create Attendance Buttons */}
            <div className="mb-4 flex justify-end space-x-2">
                <button
                    onClick={exportToExcel}
                    className={`px-3 py-2 rounded-md transition-colors duration-300 flex items-center ${isDarkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-black"
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span className="ml-1">Export Excel</span>
                </button>
                <button
                    onClick={handleCreateOpenModal}
                    className={`px-3 py-2 rounded-md transition-colors duration-300 ${isDarkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-black"
                        }`}
                >
                    <AlarmClockPlusIcon size={25} />
                </button>
            </div>

            <div className={`overflow-x-auto ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"} p-4 rounded-lg`}>
                {(!Array.isArray(userAttendance) || userAttendance.length === 0) ? (
                    <div className="text-lg text-gray-500 text-center py-8">
                        No attendance records found.
                    </div>
                ) : (
                    <>
                        <table className={`min-w-full ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
                            <thead className={isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-50 text-gray-500"}>
                                <tr>
                                    {["Date", "Time In", "Time Out", "Hours", "Status", "Action"].map((header) => (
                                        <th key={header} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">{header}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className={isDarkMode ? "bg-gray-800 divide-gray-700" : "bg-white divide-gray-200"}>
                                {userAttendance.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((record, index) => (
                                    <tr key={index} className={`hover:text-white transition ${isDarkMode ? "border-gray-700 hover:bg-emerald-600" : "border-gray-200 hover:bg-blue-500"}`}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{record.status === "pending" ? formatDate(record.pending_time_in) : formatDate(record.time_in)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{formatTime(record.time_in)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {record.time_out == null ? 'no time-out' : formatTime(record.time_out)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span>
                                                {isNaN(parseFloat(calculateWorkHours(record.time_in, record.time_out)))
                                                    ? "N/A"
                                                    : parseFloat(calculateWorkHours(record.time_in, record.time_out, record.status)).toFixed(2) + " hrs"
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

                        {Math.ceil(userAttendance.length / rowsPerPage) > 1 && (
                            <div className="flex justify-between items-center mt-4">
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className={`px-4 py-2 text-sm font-medium rounded-md ${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"} ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-400"}`}
                                >
                                    Previous
                                </button>

                                <span className="text-sm">
                                    Page {currentPage} of {Math.ceil(userAttendance.length / rowsPerPage)}
                                </span>

                                <button
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(userAttendance.length / rowsPerPage)))}
                                    disabled={currentPage === Math.ceil(userAttendance.length / rowsPerPage)}
                                    className={`px-4 py-2 text-sm font-medium rounded-md ${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"} ${currentPage === Math.ceil(userAttendance.length / rowsPerPage) ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-400"}`}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* View Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={handleViewCloseModal}
                onEditClick={handleEditOpenModal}
                onDeleteClick={handleDeleteConfirmOpen}
                record={selectedRecord}
                isDarkMode={isDarkMode}
                calculateWorkHours={calculateWorkHours}
            />

            {/* Edit Modal */}
            <EditModal
                isOpen={isEditModalOpen}
                onClose={handleEditCloseModal}
                record={selectedRecord}
                isDarkMode={isDarkMode}
                onSave={handleSaveEdit}
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={isDeleteConfirmOpen}
                onClose={handleDeleteConfirmClose}
                onConfirm={handleDeleteRecord}
                record={selectedRecord}
                isDarkMode={isDarkMode}
            />

            {/* Create Attendance Modal */}
            <CreateAttendanceModal
                isOpen={isCreateModalOpen}
                onClose={handleCreateCloseModal}
                onSave={handleCreateAttendance}
                isDarkMode={isDarkMode}
            />
        </>
    );
};

export default UserTable;
const Modal = ({ isOpen, onClose, onEditClick, onDeleteClick, record, isDarkMode, calculateWorkHours }) => {
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
                    <p><span className="font-medium">Hours:</span>                                         {isNaN(parseFloat(record.total_hours))
                        ? "N/A"
                        : parseFloat(calculateWorkHours(record.time_in, record.time_out, record.status)).toFixed(2)
                    }</p>
                    <p><span className="font-medium">Status:</span> {record.status}</p>
                    {record.status == 'pending' ? <p><span className="font-medium">Request Reason:</span> {record.request_reason}</p> : ''}
                    {record.status == 'rejected' ? <p><span className="font-medium">Reject Reason:</span> {record.rejection_reason}</p> : ''}
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
                        onClick={onDeleteClick}
                        className="px-4 py-2 text-sm font-medium rounded-lg transition duration-200 
                        bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-400 focus:outline-none"
                    >
                        Delete
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

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, record, isDarkMode }) => {
    if (!isOpen || !record) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-lg">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className={`p-6 rounded-2xl w-full max-w-md shadow-xl border ${isDarkMode ? "bg-gray-900 text-white border-gray-700" : "bg-white text-gray-900 border-gray-200"}`}
            >
                <div className="text-center">
                    <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${isDarkMode ? "bg-red-900" : "bg-red-100"} mb-4`}>
                        <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium mb-2">Confirm Deletion</h3>
                    <p className="text-sm mb-4">
                        Are you sure you want to delete the attendance record for {formatDate(record.time_in)}? This action cannot be undone.
                    </p>
                </div>
                <div className="mt-6 flex justify-center space-x-4">
                    <button
                        onClick={onClose}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition duration-200 
                        ${isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"} 
                        focus:ring-2 focus:ring-gray-400 focus:outline-none`}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 text-sm font-medium rounded-lg transition duration-200 
                        bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-400 focus:outline-none"
                    >
                        Delete
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

        if (!value || !value.includes(":")) {
            console.error("Invalid time format:", value);
            return;
        }

        const [hours, minutes] = value.split(":").map(Number);
        if (isNaN(hours) || isNaN(minutes)) {
            console.error("Invalid hours or minutes:", hours, minutes);
            return;
        }

        const dateField = name === "time_in_value" ? "time_in" : "time_out";

        setEditedRecord((prev) => {
            const baseDate = prev[dateField]
                ? new Date(prev[dateField])
                : new Date(prev.date || new Date());

            if (isNaN(baseDate.getTime())) {
                console.warn("Invalid base date detected, using current date instead.");
                baseDate.setTime(Date.now());
            }

            baseDate.setHours(hours, minutes, 0, 0);

            const isoString = baseDate.toISOString();

            console.log(`${dateField} updated to:`, isoString);

            return {
                ...prev,
                [dateField]: isoString,
            };
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

const CreateAttendanceModal = ({ isOpen, onClose, onSave, isDarkMode }) => {
    const initialDate = dayjs().tz('Asia/Manila');
    const initialTimeIn = initialDate;
    const initialTimeOut = initialDate.add(8, 'hour');

    const [formData, setFormData] = useState({
        time_in: initialTimeIn.toISOString(),
        time_out: initialTimeOut.toISOString(),
        request_reason: ""
    });

    useEffect(() => {
        if (isOpen) {
            const now = dayjs().tz('Asia/Manila');
            setFormData({
                time_in: now.toISOString(),
                time_out: now.add(8, 'hour').toISOString(),
                request_reason: ""
            });
        }
    }, [isOpen]);

    const handleDateChange = (e) => {
        const newDate = e.target.value; // YYYY-MM-DD format
        const currentTimeIn = dayjs(formData.time_in).tz('Asia/Manila');
        const currentTimeOut = dayjs(formData.time_out).tz('Asia/Manila');

        const newTimeIn = dayjs.tz(
            `${newDate} ${currentTimeIn.format('HH:mm')}`,
            'YYYY-MM-DD HH:mm', 'Asia/Manila'
        ).toISOString();

        const newTimeOut = dayjs.tz(
            `${newDate} ${currentTimeOut.format('HH:mm')}`,
            'YYYY-MM-DD HH:mm', 'Asia/Manila'
        ).toISOString();

        setFormData(prev => ({
            ...prev,
            time_in: newTimeIn,
            time_out: newTimeOut
        }));
    };

    const handleTimeChange = (e) => {
        const { name, value } = e.target; // value is in HH:mm format
        const currentDate = dayjs(formData.time_in).tz('Asia/Manila').format('YYYY-MM-DD');

        const newDateTime = dayjs.tz(
            `${currentDate} ${value}`,
            'YYYY-MM-DD HH:mm', 'Asia/Manila'
        ).toISOString();

        setFormData(prev => ({
            ...prev,
            [name]: newDateTime
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "date") {
            handleDateChange(e);
        } else if (name === "time_in" || name === "time_out") {
            handleTimeChange(e);
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = () => {
        const manilaTimeIn = dayjs(formData.time_in).tz('Asia/Manila', true); // Convert to Manila time
        const manilaTimeOut = dayjs(formData.time_out).tz('Asia/Manila', true); // Convert to Manila time

        const requestBody = {
            date: manilaTimeIn.isValid() ? manilaTimeIn.format('YYYY-MM-DD') : '',
            time_in: manilaTimeIn.isValid() ? manilaTimeIn.format('HH:mm') : '',
            time_out: manilaTimeOut.isValid() ? manilaTimeOut.format('HH:mm') : '',
            request_reason: formData.request_reason || '',
        };

        console.log("Request body to save:", requestBody);

        if (onSave) {
            onSave(requestBody); // Pass the formatted data to the parent
        }
        onClose();
    };

    const formatTimeForInput = (isoString) => {
        if (!isoString) return "";
        const date = dayjs(isoString).tz('Asia/Manila');
        return date.format('HH:mm');
    };

    const formatDateForInput = (isoString) => {
        if (!isoString) return "";
        const date = dayjs(isoString).tz('Asia/Manila');
        return date.format('YYYY-MM-DD');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className={`p-6 rounded-lg w-full max-w-md shadow-lg ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}
            >
                <h2 className="text-xl font-semibold mb-4">Create Attendance Record</h2>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="date" className="block font-medium">Date:</label>
                        <input
                            type="date"
                            id="date"
                            name="date"
                            value={formatDateForInput(formData.time_in)}
                            onChange={handleChange}
                            className={`w-full p-2 mt-1 rounded-md ${isDarkMode ? "bg-gray-700 border-gray-600" : "border-gray-300"} shadow-sm`}
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="time_in" className="block font-medium">Time In:</label>
                        <input
                            type="time"
                            id="time_in"
                            name="time_in"
                            value={formatTimeForInput(formData.time_in)}
                            onChange={handleChange}
                            className={`w-full p-2 mt-1 rounded-md ${isDarkMode ? "bg-gray-700 border-gray-600" : "border-gray-300"} shadow-sm`}
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="time_out" className="block font-medium">Time Out:</label>
                        <input
                            type="time"
                            id="time_out"
                            name="time_out"
                            value={formatTimeForInput(formData.time_out)}
                            onChange={handleChange}
                            className={`w-full p-2 mt-1 rounded-md ${isDarkMode ? "bg-gray-700 border-gray-600" : "border-gray-300"} shadow-sm`}
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="request_reason" className="block font-medium">Reason for Request:</label>
                        <textarea
                            id="request_reason"
                            name="request_reason"
                            value={formData.request_reason}
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
                            type="submit"
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};
