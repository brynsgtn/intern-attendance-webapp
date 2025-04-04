import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import { formatDate } from "../utils/date";
import UserTable from "../components/UserTable";
import { Edit, LogOut, LogIn, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAttendanceStore } from "../store/attendanceStore";
import { toast } from "react-hot-toast"
import TabMenu from "../components/TabMenu";


const DashboardPage = () => {
	const { user, logout, isDarkMode } = useAuthStore();
	const { timeIn, timeOut, getTotalHours, refreshAttendance } = useAttendanceStore();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [totalHours, setTotalHours] = useState(0);
	const [refreshKey, setRefreshKey] = useState(0); // State to trigger refetch

	if (!user || !user._id) {
		return <div className="flex justify-center items-center h-screen">Loading user data...</div>;
	}


	useEffect(() => {
		if (user && user._id) {
			const getTotalHoursData = async () => {
				try {
					const response = await getTotalHours(user._id);
					setTotalHours(response.data.totalHours);
				} catch (error) {
					console.error("Error fetching total hours:", error);
				}
			};
			getTotalHoursData();
		}
	}, [user._id, totalHours]); // Add totalHours as a dependency

	console.log(user)
	const handleTimeIn = async () => {
		try {
			await timeIn(user._id);
			toast.success("Successfully timed in!");
			const response = await getTotalHours(user._id); // Fetch updated hours
			setTotalHours(response.data.totalHours);
			refreshAttendance(user.id);
			setRefreshKey(prev => prev + 1); // Trigger refetch
		} catch (error) {
			console.error("Time in error:", error);
			toast.error(error.response?.data?.message || "Already timed-in today!");
		}
	};

	const handleTimeOut = async () => {
		try {
			await timeOut(user._id);
			toast.success("Successfully timed out!");
			const response = await getTotalHours(user._id); // Fetch updated hours
			setTotalHours(response.data.totalHours);
			refreshAttendance(user.id);
			setRefreshKey(prev => prev + 1); // Trigger refetch
		} catch (error) {
			console.error("Time out error:", error);
			toast.error(error.response?.data?.message || "Already timed-out today!");
		}
	};

	const completedPercentage = Math.min(
		(totalHours / user.required_hours) * 100,
		100
	).toFixed(1);



	return (
		<>
			<main className="flex-grow flex justify-center items-center px-4 mt-120 mb-30 max-h-screen sm:px-1 lg:px-8 max-w-6xl w-full">
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.9 }}
					transition={{ duration: 0.5 }}
					className={`max-w-6xl w-full py-8 px-2 md:p-8 bg-opacity-80 backdrop-filter backdrop-blur-lg rounded-xl shadow-2xl text-white ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} `}
				>
					<h2 className={`text-xl sm:text-4xl font-bold mb-10  bg-gradient-to-r ${isDarkMode ? 'from-green-400 to-emerald-500' : 'from-blue-500 to-gray-400'} text-transparent bg-clip-text`}>
						Your Attendance Dashboard
					</h2>

					<div className="space-y-6">
						<motion.div
							className={`relative p-6 bg-opacity-50 rounded-lg ${isDarkMode ? "bg-gray-900 text-gray-300" : "bg-gray-200 text-gray-900"}`}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2 }}
						>
							<h3 className={`text-lg sm:text-xl font-semibold ${isDarkMode ? 'text-emerald-500' : 'text-blue-500'} mb-4`}>
								Profile Information
							</h3>
							{/* Edit Button - Always Visible, Darker on Hover */}
							<button
								className={`absolute top-4 right-4 p-2 rounded-full ${isDarkMode ? "hover:text-white text-emerald-500" : "hover:text-emerald-500 text-blue-500"} transition cursor-pointer`}
								onClick={() => setIsModalOpen(true)}
							>
								<Edit size={18} />
							</button>

							{/* Container for image, user details, and role */}
							<div className="flex flex-col md:flex-row items-center md:items-start gap-6 group">
								{/* Profile Image */}

								<div className="flex-shrink-0 md:ml-10 mt-5">
									<img
										src={user.image ? `http://localhost:3000/images/${user.image}` : '/profile.png'}
										alt="User Profile"
										className="w-45 h-45 rounded-full object-cover shadow-lg"
									/>
								</div>


								{/* User Details */}
								<div className="flex-1 md:ml-10">
									<p className="font-semibold text-xs md:text-lg">
										Name: <span className="font-normal">{user.last_name}, {user.first_name} {user.middle_initial}</span>
									</p>
									<p className="font-semibold text-xs md:text-lg mt-2">
										Email: <span className="font-normal">{user.email}</span>
									</p>
									<p className="font-semibold text-xs md:text-lg mt-2">
										School: <span className="font-normal">{user.school}</span>
									</p>


									{/* Progress Bar for Required Hours */}
									<div className="mt-4">
										<p className="font-semibold">Progress:</p>
										<div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden mt-1 relative">
											<div
												className={`${isDarkMode ? 'bg-green-500' : 'bg-blue-500'} h-4 rounded-full transition-all`}
												style={{ width: `${completedPercentage}%` }}
											></div>
											<span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
												{completedPercentage}%
											</span>
										</div>
										<p className="text-sm mt-1">
											{totalHours.toFixed(2)} / {user.required_hours} hours completed
										</p>
									</div>
								</div>


								{/* Role Section - Positioned on the Right Side */}
								<div className="md:flex flex-col items-end">
									<span className={`px-3 py-1 text-sm font-semibold text-white ${isDarkMode ? 'bg-green-500' : 'bg-blue-500'} rounded-full shadow-md`}>
										{user.team ? `${user.team} - ` : ""}
										{user.isAdmin ? "Admin" : user.isTeamLeader ? "Team Leader" : "Member"}
									</span>
								</div>
								{/* Clock In & Clock Out Buttons */}

							</div>
							<div className="mt-4 flex flex-col md:flex-row items-center justify-center h-full gap-3">
								<button
									className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white shadow-md transition"
									onClick={handleTimeIn}
								>
									<LogIn size={18} /> Time In
								</button>
								<button
									className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-md transition"
									onClick={handleTimeOut}>
									<LogOut size={18} /> Time Out
								</button>
							</div>

						</motion.div>
						<TabMenu />
						<motion.div
							className={`relative p-6 bg-opacity-50 rounded-lg ${isDarkMode ? "bg-gray-900 text-gray-300" : "bg-gray-200 text-gray-900"}`}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.4 }}
						>
					
							<h3 className={`text-lg sm:text-xl font-semibold ${isDarkMode ? 'text-emerald-500' : 'text-blue-500'} mb-4`}>Recent Attendance</h3>
							<UserTable key={refreshKey} />
						</motion.div>
					</div>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.6 }}
						className="mt-4"
					>
					</motion.div>
				</motion.div>
			</main>

			{/* Edit Profile Modal */}
			<EditProfileModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
		</>
	);
};

export default DashboardPage;


const EditProfileModal = ({ isOpen, onClose }) => {
	const { user, isDarkMode, editUserProfile } = useAuthStore();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const formRef = useRef(null);
	const navigate = useNavigate();

	if (!isOpen) return null;
	console.log(user)
	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const form = formRef.current;
			const formData = new FormData();

			// Get form values
			const first_name = form.querySelector('[name="first_name"]').value;
			const middle_initial = form.querySelector('[name="middle_initial"]').value;
			const last_name = form.querySelector('[name="last_name"]').value;
			const required_hours = form.querySelector('[name="required_hours"]').value;
			const team = form.querySelector('[name="team"]').value;
			const imageFile = form.querySelector('[name="file"]').files[0];
			// Automatically set isVerified to true
			formData.append('isVerified', true);
			// Add fields to formData
			formData.append('first_name', first_name);
			formData.append('middle_initial', middle_initial);
			formData.append('last_name', last_name);
			formData.append('required_hours', required_hours);
			formData.append('team', team);
			console.log("Form Data before submitting:", formData);
			// Add image if selected
			if (imageFile) {
				formData.append('file', imageFile);
			}

			console.log("Submitting form data:", formData);

			const updatedUser = await editUserProfile(formData);

			if (updatedUser) {
				console.log("Profile updated successfully:", updatedUser);
				onClose(); // Close the modal

				// Instead of immediately navigating, add a small delay
				setTimeout(() => {
					navigate("/"); // Navigate after the state has been updated
				}, 100);
			}
		} catch (error) {
			console.error("Error updating profile:", error);
		} finally {
			setIsSubmitting(false);
		}
	};


	return (
		<div className="fixed inset-0 flex items-center justify-center z-50  bg-opacity-50 backdrop-blur-md">
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.9 }}
				transition={{ duration: 0.3 }}
				className={`p-6 rounded-lg w-full max-w-md shadow-lg ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}
			>
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-bold">Edit Profile</h2>
					<button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition">
						<X size={18} />
					</button>
				</div>

				{/* Form Fields */}
				<form ref={formRef} onSubmit={handleSubmit}>
					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium">Profile Image</label>
							<input
								type="file"
								name="file"
								accept="image/*"
								className="w-full text-slate-500 font-medium text-sm bg-white border file:cursor-pointer cursor-pointer file:border-0 file:py-3 file:px-4 file:mr-4 file:bg-gray-100 file:hover:bg-gray-200 file:text-slate-500 rounded"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium">First Name</label>
							<input
								type="text"
								name="first_name"
								defaultValue={user.first_name}
								className="w-full px-3 py-2 rounded-md bg-gray-100 text-gray-900"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium">Middle Initial</label>
							<input
								type="text"
								name="middle_initial"
								defaultValue={user.middle_initial}
								className="w-full px-3 py-2 rounded-md bg-gray-100 text-gray-900"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium">Last Name</label>
							<input
								type="text"
								name="last_name"
								defaultValue={user.last_name}
								className="w-full px-3 py-2 rounded-md bg-gray-100 text-gray-900"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium">Required Hours</label>
							<input
								type="number"
								name="required_hours"
								defaultValue={user.required_hours}
								className="w-full px-3 py-2 rounded-md bg-gray-100 text-gray-900"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium">Team</label>
							<select
								name="team"
								defaultValue={user.team}
								className="w-full px-3 py-2 rounded-md bg-gray-100 text-gray-900"
							>
								{[...Array(7).keys()].map(i => (
									<option key={i + 1} value={`Team ${i + 1}`}>Team {i + 1}</option>
								))}
							</select>
						</div>
					</div>

					{/* Buttons */}
					<div className="mt-6 flex justify-end space-x-3">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-700 transition"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition"
						>
							{isSubmitting ? 'Saving...' : 'Save Changes'}
						</button>
					</div>
				</form>

			</motion.div>
		
		</div>
	);
};
