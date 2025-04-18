import { useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import { useNavigate, useParams } from "react-router-dom";
import Input from "../components/Input";
import { Lock } from "lucide-react";
import toast from "react-hot-toast";
import PasswordInput from "../components/PasswordInput";

const ResetPasswordPage = () => {
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const { resetPassword, error, isLoading, message, isDarkMode } = useAuthStore();

	const confirmedPassword = password === confirmPassword;

	const { token } = useParams();
	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (password !== confirmPassword) {
			alert("Passwords do not match");
			return;
		}
		try {
			await resetPassword(token, password);

			toast.success("Password reset successfully, redirecting to login page...");
			setTimeout(() => {
				navigate("/login");
			}, 2000);
		} catch (error) {
			console.error(error);
			toast.error(error.message || "Error resetting password");
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
			className={`max-w-md w-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-300'} bg-opacity-50 rounded-2xl shadow-xl overflow-hidden`}
		>
			<div className='p-8'>
				<h2 className={`text-3xl font-bold mb-6 text-center bg-gradient-to-r ${isDarkMode ? 'from-green-400 to-emerald-500' : 'from-blue-600 to-blue-500'} text-transparent bg-clip-text`}>
					Reset Password
				</h2>
				{error && <p className='text-red-500 text-sm mb-4'>{error}</p>}
				{message && <p className={`${isDarkMode ? "text-gray-400" : "text-gray-600"} text-sm mb-4`}>{message}</p>}

				<form onSubmit={handleSubmit}>
					<div>
						<PasswordInput
							icon={Lock}
							type='password'
							placeholder='New Password'
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							isDarkMode={isDarkMode}
						/>
						<PasswordInput
							icon={Lock}
							type='password'
							placeholder='Confirm New Password'
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							required
							isDarkMode={isDarkMode}
						/>
					</div>

					{!confirmedPassword && <p className="text-red-500 font-semibold my-4">Passwords do not match!</p>}
					<motion.button
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						className={`w-full py-3 px-4 font-bold rounded-lg shadow-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${isDarkMode
							? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 focus:ring-blue-500 "
							: "bg-blue-500 border-gray-600 focus:ring-blue-500 text-white"
							}`}
						type='submit'
						disabled={!confirmedPassword || isLoading}
					>
						{isLoading ? "Resetting..." : "Set New Password"}
					</motion.button>
				</form>
			</div>
		</motion.div>
	);
};
export default ResetPasswordPage;