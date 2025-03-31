import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Loader } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../components/Input";
import PasswordInput from "../components/PasswordInput";
import { useAuthStore } from "../store/authStore";

const LogInPage = ({ isDarkMode }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showResend, setShowResend] = useState(false);

  const navigate = useNavigate();

  const { login, isLoading, error, resendVerificationEmail, clearError } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);

    } catch (error) {
      if (error.response?.data?.message === 'User not verified') {
        setShowResend(true);
      } else {
        console.log(error);
      }
    }
  };

  const handleResendVerification = async () => {
    try {
      await resendVerificationEmail(email);
      navigate("/verify-email");
    } catch (error) {
      console.log(error.response.data);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`max-w-md w-full ${isDarkMode ? 'bg-gray-900' : 'bg-white text-gray-800'} bg-opacity-80  rounded-2xl shadow-xl overflow-hidden`}
    >
      <div className='p-8'>
        <h2 className={`text-3xl font-bold mb-10 text-center bg-gradient-to-r ${isDarkMode ? 'from-gray-400 to-gray-300' : 'from-blue-600 to-blue-500'} text-transparent bg-clip-text`}>
          Welcome Back
        </h2>

        <form onSubmit={handleLogin}>
          <Input
            icon={Mail}
            type='email'
            placeholder='Email Address'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            isDarkMode={isDarkMode}
          />

          <PasswordInput
            icon={Lock}
            type='password'
            placeholder='Password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            isDarkMode={isDarkMode}
          />

          <div className='flex items-center mb-6'>
            <Link to='/forgot-password' className={`text-sm ${isDarkMode ? "text-green-400" : "text-blue-600"}`}>
              Forgot password?
            </Link>
          </div>
          <p className='text-red-500 font-semibold mb-2'></p>
          {error && <p className='text-red-500 font-semibold mb-2'>{error}</p>}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`mt-1 w-full py-3 px-4 ${isDarkMode
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 focus:ring-green-500'
              : 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white hover:from-blue-500 hover:to-indigo-600 focus:ring-blue-500'
              } font-bold rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-200 cursor-pointer`}
            type='submit'
            disabled={isLoading}
          >
            {isLoading ? <Loader className='w-6 h-6 animate-spin  mx-auto' /> : "Login"}
          </motion.button>
        </form>
        {showResend && (
          <div className={`mt-4 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
              Didn't receive a verification email?
            </p>
            <button
              onClick={handleResendVerification}
              className={`hover:underline cursor-pointer ${isDarkMode ? 'hover:text-green-400 text-green-500 ' : 'text-blue-500 hover:text-BLUE-600'}`}
              disabled={isLoading}
            >
              Resend Verification Email
            </button>
          </div>
        )}
      </div>
      <div className={`px-8 py-4 flex justify-center ${isDarkMode ? "bg-gray-900 bg-opacity-50" : "bg-gray-200"}`}>
        <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
          Don't have an account?{" "}
          <Link to='/signup' onClick={clearError} className={`${isDarkMode ? "text-green-400 hover:underline" : "text-blue-600 hover:underline"}`}>
            Sign up
          </Link>
        </p>
      </div>
    </motion.div>
  );
};
export default LogInPage