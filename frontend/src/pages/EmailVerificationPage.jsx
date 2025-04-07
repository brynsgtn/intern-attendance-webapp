import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import { Moon, Sun } from "lucide-react"; // Lucide icons


const EmailVerificationPage = () => {
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const inputRefs = useRef([]);
    const navigate = useNavigate();

    const { error, isLoading, verifyEmail, isDarkMode, darkmode } = useAuthStore();


    const handleChange = (index, value) => {
        const newCode = [...code];

        // Handle pasted content
        if (value.length > 1) {
            const pastedCode = value.slice(0, 6).split("");
            for (let i = 0; i < 6; i++) {
                newCode[i] = pastedCode[i] || "";
            }
            setCode(newCode);

            // Focus on the last non-empty input or the first empty one
            const lastFilledIndex = newCode.findLastIndex((digit) => digit !== "");
            const focusIndex = lastFilledIndex < 5 ? lastFilledIndex + 1 : 5;
            inputRefs.current[focusIndex].focus();
        } else {
            newCode[index] = value;
            setCode(newCode);

            // Move focus to the next input field if value is entered
            if (value && index < 5) {
                inputRefs.current[index + 1].focus();
            }
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const verificationCode = code.join("");
        try {
            await verifyEmail(verificationCode);
            navigate("/");
            toast.success("Email verified successfully");
        } catch (error) {
            console.log(error);
        }
    };

    // Auto submit when all fields are filled
    useEffect(() => {
        if (code.every((digit) => digit !== "")) {
            handleSubmit(new Event("submit"));
        }
    }, [code]);

    return (
        <div className={`max-w-md w-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-300'} bg-opacity-50 rounded-2xl shadow-xl overflow-hidden`}>
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`max-w-4xl w-full ${isDarkMode ? 'bg-gray-900' : 'bg-white text-gray-800'} bg-opacity-80  rounded-2xl shadow-xl overflow-hidden pt-4 px-8 pb-8`}
            >
                <div className="text-right">
                    <button
                        onClick={darkmode}
                        title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        className={`p-2 rounded-full border-2 transition duration-300 ${isDarkMode
                            ? "border-white text-white hover:bg-white hover:text-black"
                            : "border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white"
                            }`}
                    >
                        {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
                    </button>
                </div>
                <h2 className={`text-3xl font-bold mb-6 text-center bg-gradient-to-r ${isDarkMode ? 'from-green-400 to-emerald-500' : 'from-gray-600 to-gray-500'} text-transparent bg-clip-text`}>
                    Verify Your Email
                </h2>
                <p className={`mb-6 text-center ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Enter the 6-digit code sent to your email address.</p>

                <form onSubmit={handleSubmit} className='space-y-6'>
                    <div className='flex justify-between'>
                        {code.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type='text'
                                maxLength='6'
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className={`w-12 h-12 text-center text-2xl font-bold bg-gray-700 rounded-lg border-2 focus:outline-none ${isDarkMode
                                    ? 'bg-gray-800 border-gray-700 focus:border-green-500 text-white'
                                    : 'bg-white border-gray-300 focus:border-blue-500 text-gray-500'
                                    }`}

                            />
                        ))}
                    </div>
                    {error && <p className='text-red-500 font-semibold mt-2'>{error}</p>}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type='submit'
                        disabled={isLoading || code.some((digit) => !digit)}
                        className={`mt-5 w-full py-3 px-4 ${isDarkMode
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 focus:ring-green-500'
                            : 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white hover:from-blue-500 hover:to-indigo-600 focus:ring-blue-500'
                            } font-bold rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-200 cursor-pointer`}
                    >
                        {isLoading ? "Verifying..." : "Verify Email"}
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
};
export default EmailVerificationPage;