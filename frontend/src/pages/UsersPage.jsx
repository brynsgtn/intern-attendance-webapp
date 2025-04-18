import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import { useState, useEffect } from "react";
import { Pencil, Trash2, User, UserCheck, Users, ChevronLeft, ChevronRight, X, SendHorizonal, LucideUserRoundPlus } from "lucide-react";
import { useAttendanceStore } from "../store/attendanceStore";
import { toast } from "react-hot-toast";

const UsersPage = () => {
    const { isDarkMode, getAllUsers, addNewIntern, deleteIntern, updateInternRole, sendCompletionEmail } = useAuthStore();
    const { getInternRemainingHours } = useAttendanceStore();
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [interns, setInterns] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const itemsPerPage = 10;
    const [emailSent, setEmailSent] = useState(false); // State to track email sent status


    // New intern form state
    const [newIntern, setNewIntern] = useState({
        first_name: '',
        middle_initial: '',
        last_name: '',
        email: '',
        password: '',
        school: '',
        required_hours: '',
        team: '',
        role: ''
    });

    const fetchInterns = async () => {
        setIsLoading(true);
        try {
            const users = await getAllUsers();

            // Fetch remaining hours for each user
            const usersWithHours = await Promise.all(users.map(async (user) => {
                try {
                    const response = await getInternRemainingHours(user._id);
                    return {
                        ...user,
                        remainingHours: response.member.remaining_hours,
                        requiredHours: response.member.required_hours,
                        hoursWorked: response.member.total_hours_worked,
                        completionPercentage: response.member.completion_percentage
                    };
                } catch (err) {
                    console.error(`Error fetching hours for ${user.full_name}`, err);
                    return { ...user, remainingHours: 0 }; // fallback
                }
            }));

            setInterns(usersWithHours);
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching interns:", error);
            setError("Failed to load interns");
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInterns();
    }, []);

    const totalPages = Math.ceil(interns.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentUsers = interns.slice(indexOfFirstItem, indexOfLastItem);

    const handleEdit = (user) => {
        setCurrentUser(user);
        setShowEditModal(true);
    };

    const handleDelete = (user) => {
        setCurrentUser(user);
        setShowDeleteModal(true);
    };

    // Send completion email to the backend
    const handleSendCompletionEmail = async (email, memberName, userId) => {
        try {
            await sendCompletionEmail(email, memberName, userId);
            setEmailSent(true); // Set email sent status to true after success
            toast.success(`Completion email sent to ${memberName}`);


            if (error) {
                toast.error(error || 'Failed to send email');
            }
        } catch (err) {
            console.error('Error sending completion email:', err);
            toast.error('Failed to send email');
        }

    };

    const confirmEdit = async () => {
        try {
            // Get the selected role from the current user state
            const selectedRole = currentUser.isAdmin
                ? "ADMIN"
                : currentUser.isTeamLeader
                    ? "TEAM_LEADER"
                    : "MEMBER";

            // Prepare the formData that includes user_id, role, and team
            const updatedData = {
                user_id: currentUser._id,
                role: selectedRole,  // Use the properly formatted role string
                team: currentUser.team
            };

            // Call the store method to update the user's role
            const response = await updateInternRole(updatedData);

            // After successful update, close the modal
            setShowEditModal(false);

            // Display success message
            toast.success("User role updated successfully!");

            // Refresh the intern list to show updated data
            await fetchInterns();

        } catch (error) {
            // Handle error
            toast.error(error?.response?.data?.message || "Failed to update user role.");
        }
    };

    const confirmDelete = async () => {
        setIsLoading(true);
        try {
            await deleteIntern(currentUser._id);
            setShowDeleteModal(false);
            toast.success("Intern deleted!")
            await fetchInterns();
        } catch (error) {
            console.error("Error deleting intern:", error);
            toast.success(error.message)
            setError("Failed to delete intern");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddIntern = async () => {
        setIsLoading(true);
        try {
            // Create full_name from parts
            const internData = {
                ...newIntern,
                full_name: `${newIntern.first_name} ${newIntern.middle_initial ? newIntern.middle_initial + ' ' : ''}${newIntern.last_name}`
            };

            await addNewIntern(internData);
            toast.success("Intern added successfully!")
            setShowAddModal(false);
            clearNewInternForm();
            await fetchInterns();
        } catch (error) {
            console.error("Error adding intern:", error);
            toast.error("error")
            setError("Failed to add intern");
        } finally {
            setIsLoading(false);
        }
    };

    const clearNewInternForm = () => {
        setNewIntern({
            first_name: '',
            middle_initial: '',
            last_name: '',
            email: '',
            password: '',
            school: '',
            required_hours: '',
            team: '',
            role: ''
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewIntern({
            ...newIntern,
            [name]: value
        });
    };

    const nextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const prevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const renderStatusBadge = (remainingHours) => {
        const status = remainingHours > 0 ? "Ongoing" : "Finished";
        const statusColors = {
            Ongoing: "bg-blue-500",
            Finished: "bg-green-500"
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs ${statusColors[status]} text-white font-medium`}>
                {status}
            </span>
        );
    };

    const renderRoleIcon = (role) => {
        switch (role) {
            case "Admin":
                return <UserCheck size={16} className="mr-1 text-red-500" />;
            case "Team Leader":
                return <Users size={16} className="mr-1 text-blue-500" />;
            default:
                return <User size={16} className="mr-1 text-gray-500" />;
        }
    };

    const getUserRole = (user) => {
        if (user.isAdmin) return "Admin";
        if (user.isTeamLeader) return "Team Leader";
        return "Member";
    };

    return (
        <main className="flex-grow flex justify-center items-center px-4 py-8 my-30 max-h-screen sm:px-1 lg:px-8 max-w-6xl w-full">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5 }}
                className={`max-w-6xl w-full py-6 px-2 md:p-6 bg-opacity-80 backdrop-filter backdrop-blur-lg rounded-xl shadow-2xl ${isDarkMode ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-900"}`}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className={`text-xl sm:text-3xl font-bold bg-gradient-to-r ${isDarkMode ? "from-green-400 to-emerald-500" : "from-blue-500 to-gray-700"} text-transparent bg-clip-text`}>
                        Manage Interns
                    </h2>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className={`px-4 py-2 rounded-lg text-white ${isDarkMode ? "bg-green-600" : "bg-blue-600"} hover:opacity-90 transition-opacity`}
                    >
                        <LucideUserRoundPlus size={20} />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={`relative p-4 bg-opacity-50 rounded-lg overflow-x-auto ${isDarkMode ? "bg-gray-900 text-gray-300" : "bg-gray-200 text-gray-900"}`}
                >
                    {isLoading ? (
                        <div className="flex justify-center items-center p-10">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <>
                            <table className="min-w-full table-auto text-sm sm:text-base">
                                <thead>
                                    <tr className={`border-b ${isDarkMode ? "border-gray-700" : "border-gray-400"}`}>
                                        <th className="px-3 py-3 text-left">Name</th>
                                        <th className="px-3 py-3 text-left">Team</th>
                                        <th className="px-3 py-3 text-left">Status</th>
                                        <th className="px-3 py-3 text-left">Remaining Hours</th>
                                        <th className="px-3 py-3 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentUsers.map((user) => (
                                        <tr key={user._id} className={`border-b ${isDarkMode ? "border-gray-700 hover:bg-gray-800" : "border-gray-300 hover:bg-gray-100"} transition-colors`}>
                                            <td className="px-3 py-3">
                                                <div className="flex items-center">
                                                    <img
                                                        src={user.image ? `http://localhost:3000/images/${user.image}` : "/profile.png"}
                                                        alt={user.full_name}
                                                        className="w-8 h-8 rounded-full mr-3"
                                                    />
                                                    <div>
                                                        <div className="font-medium">{user.full_name}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                                                        <div className="flex items-center text-xs text-gray-500">
                                                            {renderRoleIcon(getUserRole(user))}
                                                            {getUserRole(user)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">{user.team}</td>
                                            <td className="px-3 py-3">{renderStatusBadge(user.remainingHours)}</td>
                                            <td className="px-3 py-3">
                                                {user.remainingHours > 0 ? (
                                                    <>
                                                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                                            <div
                                                                className={`h-2.5 rounded-full ${user.remainingHours > 30 ? "bg-green-500" :
                                                                    user.remainingHours > 15 ? "bg-yellow-500" : "bg-red-500"
                                                                    }`}
                                                                style={{ width: `${Math.min((user.hoursWorked / user.requiredHours) * 100, 100)}%` }}>
                                                            </div>
                                                        </div>
                                                        <span className="text-xs mt-1 block">{user.remainingHours} hours remaining</span>
                                                    </>
                                                ) : (
                                                    <span className="text-xs font-medium text-green-500">Completed</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <div className="flex justify-center gap-2">
                                                    {user.remainingHours > 0 ? (
                                                        <>
                                                            <button onClick={() => handleEdit(user)} className="text-blue-500 hover:text-blue-700">
                                                                <Pencil size={18} />
                                                            </button>
                                                            <button onClick={() => handleDelete(user)} className="text-red-500 hover:text-red-700">
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        // Conditionally render buttons based on the email sent status
                                                        user.isFinished ? (
                                                            <button
                                                                onClick={() => handleResendEmail(user.email, user.first_name, user._id)}
                                                                className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-full text-xs hover:bg-blue-700 transition"
                                                            >
                                                                <SendHorizonal size={20} /> Resend Email
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleSendCompletionEmail(user.email, user.first_name, user._id)}
                                                                className="inline-flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-full text-xs hover:bg-green-700 transition"
                                                                disabled={isLoading}
                                                            >
                                                                {isLoading ? 'Sending...' : <><SendHorizonal size={20} /> Email Completion</>}
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </td>

                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="flex justify-between items-center mt-4 px-3">
                                <div className="text-sm"></div>
                                <div className="flex space-x-2">
                                    <button onClick={prevPage} disabled={currentPage === 1} className={`p-2 rounded-lg flex items-center ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-300"} transition-colors`}>
                                        <ChevronLeft size={16} />
                                    </button>
                                    <div className={`px-3 py-1 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-300"}`}>{currentPage} / {totalPages || 1}</div>
                                    <button onClick={nextPage} disabled={currentPage === totalPages} className={`p-2 rounded-lg flex items-center ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-300"} transition-colors`}>
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </motion.div>
            </motion.div>

            {/* Edit User Modal - For Role and Team only */}
            {showEditModal && currentUser && (
                <div className="fixed inset-0 backdrop-blur-md bg-opacity-50 flex items-center justify-center z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`relative w-full max-w-md p-6 rounded-lg shadow-xl ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
                            }`}
                    >
                        <h3 className="text-xl font-semibold mb-4">Assign Role & Team</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-center mb-4">
                                <img
                                    src={
                                        currentUser.image
                                            ? `http://localhost:3000/images/${currentUser.image}`
                                            : "/profile.png"
                                    }
                                    alt={currentUser.full_name}
                                    className="w-16 h-16 rounded-full"
                                />
                            </div>
                            <div className="text-center mb-4 font-medium">{currentUser.full_name}</div>

                            {/* Team Dropdown */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Team</label>
                                <select
                                    value={currentUser.team}
                                    onChange={(e) =>
                                        setCurrentUser({ ...currentUser, team: e.target.value })
                                    }
                                    className={`w-full p-2 rounded border ${isDarkMode ? "bg-gray-700" : "bg-white"
                                        }`}
                                >
                                    <option value="">Select a team</option>
                                    <option value="Team 1">Team 1</option>
                                    <option value="Team 2">Team 2</option>
                                    <option value="Team 3">Team 3</option>
                                    <option value="Team 4">Team 4</option>
                                    <option value="Team 5">Team 5</option>
                                    <option value="Team 6">Team 6</option>
                                    <option value="Team 7">Team 7</option>
                                </select>
                            </div>

                            {/* Role Dropdown */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Role</label>
                                <select
                                    value={
                                        currentUser.isAdmin
                                            ? "Admin"
                                            : currentUser.isTeamLeader
                                                ? "Team Leader"
                                                : "Member"
                                    }
                                    onChange={(e) => {
                                        const selectedRole = e.target.value;
                                        setCurrentUser((prev) => ({
                                            ...prev,
                                            isAdmin: selectedRole === "Admin",
                                            isTeamLeader: selectedRole === "Team Leader",
                                            isFinished: selectedRole === "Finished",
                                        }));
                                    }}
                                    className={`w-full p-2 rounded border ${isDarkMode ? "bg-gray-700" : "bg-white"
                                        }`}
                                >
                                    <option value="Admin">Admin</option>
                                    <option value="Team Leader">Team Leader</option>
                                    <option value="Member">Member</option>
                                </select>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className={`px-4 py-2 rounded ${isDarkMode
                                    ? "bg-gray-700 hover:bg-gray-600"
                                    : "bg-gray-200 hover:bg-gray-300"
                                    } transition-colors`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmEdit}
                                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}


            {/* Delete Confirmation Modal */}
            {showDeleteModal && currentUser && (
                <div className="fixed inset-0 backdrop-blur-md bg-opacity-50 flex items-center justify-center z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`relative w-full max-w-md p-6 rounded-lg shadow-xl ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}
                    >
                        <h3 className="text-xl font-semibold mb-4">Confirm Deletion</h3>
                        <p className="mb-6">Are you sure you want to delete user <strong>{currentUser.full_name}</strong>? This action cannot be undone.</p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className={`px-4 py-2 rounded ${isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"} transition-colors`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Add New Intern Modal */}
            {showAddModal && (
                <div className="fixed inset-0 backdrop-blur-md bg-opacity-50 flex items-center justify-center z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`relative w-full max-w-md p-6 rounded-lg shadow-xl ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">Add New Intern</h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">First Name *</label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={newIntern.first_name}
                                        onChange={handleInputChange}
                                        className={`w-full p-2 rounded border ${isDarkMode ? "bg-gray-700" : "bg-white"}`}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Middle Initial</label>
                                    <input
                                        type="text"
                                        name="middle_initial"
                                        value={newIntern.middle_initial}
                                        onChange={handleInputChange}
                                        className={`w-full p-2 rounded border ${isDarkMode ? "bg-gray-700" : "bg-white"}`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Last Name *</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={newIntern.last_name}
                                    onChange={handleInputChange}
                                    className={`w-full p-2 rounded border ${isDarkMode ? "bg-gray-700" : "bg-white"}`}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={newIntern.email}
                                    onChange={handleInputChange}
                                    className={`w-full p-2 rounded border ${isDarkMode ? "bg-gray-700" : "bg-white"}`}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Password *</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={newIntern.password}
                                    onChange={handleInputChange}
                                    className={`w-full p-2 rounded border ${isDarkMode ? "bg-gray-700" : "bg-white"}`}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">School *</label>
                                <input
                                    type="text"
                                    name="school"
                                    value={newIntern.school}
                                    onChange={handleInputChange}
                                    className={`w-full p-2 rounded border ${isDarkMode ? "bg-gray-700" : "bg-white"}`}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Required Hours *</label>
                                <input
                                    type="number"
                                    name="required_hours"
                                    value={newIntern.required_hours}
                                    onChange={handleInputChange}
                                    className={`w-full p-2 rounded border ${isDarkMode ? "bg-gray-700" : "bg-white"}`}
                                    min="1"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Team *</label>
                                <select
                                    name="team"
                                    value={newIntern.team}
                                    onChange={handleInputChange}
                                    className={`w-full p-2 rounded border ${isDarkMode ? "bg-gray-700" : "bg-white"}`}
                                    required
                                >
                                    <option value="Team 1">Team 1</option>
                                    <option value="Team 2">Team 2</option>
                                    <option value="Team 3">Team 3</option>
                                    <option value="Team 4">Team 4</option>
                                    <option value="Team 5">Team 5</option>
                                    <option value="Team 6">Team 6</option>
                                    <option value="Team 7">Team 7</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Role *</label>
                                <select
                                    name="role"
                                    value={newIntern.role}
                                    onChange={handleInputChange}
                                    className={`w-full p-2 rounded border ${isDarkMode ? "bg-gray-700" : "bg-white"}`}
                                    required
                                >
                                    <option value="Admin">Admin</option>
                                    <option value="Team Leader">Team Leader</option>
                                    <option value="Member">Member</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className={`px-4 py-2 rounded ${isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"} transition-colors`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddIntern}
                                className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white transition-colors"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Adding...' : 'Add Intern'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </main>
    );
};

export default UsersPage;