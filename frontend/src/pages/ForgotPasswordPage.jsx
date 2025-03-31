import { motion } from "framer-motion";
import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import Input from "../components/Input";
import { ArrowLeft, Loader, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const ForgotPasswordPage = ({isDarkMode}) => {
	const [email, setEmail] = useState("");
	const [isSubmitted, setIsSubmitted] = useState(false);

	const { isLoading, forgotPassword } = useAuthStore();

	const handleSubmit = async (e) => {
		e.preventDefault();
		await forgotPassword(email);
		setIsSubmitted(true);
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
					Forgot Password
				</h2>

				{!isSubmitted ? (
					<form onSubmit={handleSubmit}>
						<p className={`mb-6 text-center ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
							Enter your email address and we'll send you a link to reset your password.
						</p>
						<Input
							icon={Mail}
							type='email'
							placeholder='Email Address'
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
                            isDarkMode={isDarkMode}
						/>
						<motion.button
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
                            className={`w-full py-3 px-4 font-bold rounded-lg shadow-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${
		isDarkMode
			? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 focus:ring-blue-500 "
			: "bg-blue-500 border-gray-600 focus:ring-blue-500 text-white"
	}`}
						>
							{isLoading ? <Loader className='size-6 animate-spin mx-auto' /> : "Send Reset Link"}
						</motion.button>
					</form>
				) : (
					<div className='text-center'>
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ type: "spring", stiffness: 500, damping: 30 }}
							className='w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4'
						>
							<Mail className='h-8 w-8 text-white' />
						</motion.div>
						<p className={`mb-6 text-center ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
							If an account exists for {email}, you will receive a password reset link shortly.
						</p>
					</div>
				)}
			</div>

			<div className={`px-8 py-4 flex justify-center ${isDarkMode ? "bg-gray-900 bg-opacity-50" : "bg-gray-200"}`}>
				<Link to={"/login"} className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"} hover:underline flex items-center`}>
					<ArrowLeft className='h-4 w-4 mr-2' /> Back to Login
				</Link>
			</div>
		</motion.div>
	);
};
export default ForgotPasswordPage;