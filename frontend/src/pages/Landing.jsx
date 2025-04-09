import { useAuthStore } from "../store/authStore";
import { Link } from "react-router-dom";
import { Moon, Sun } from "lucide-react"; // Lucide icons
import { useEffect } from "react";

const Landing = () => {
    const { isDarkMode, isAuthenticated, darkmode, user } = useAuthStore();

    useEffect(() => {
        console.log (user)
    })
    return (
        <div className="grid md:grid-cols-2 items-center md:gap-4 gap-8 max-w-5xl max-md:max-w-md mx-auto px-4 py-10 h-screen">
            {/* Text Section */}
            <div className="max-md:order-1 max-md:text-center">
                <h3
                    className={`
            font-extrabold 
            md:text-5xl 
            text-4xl 
            md:leading-tight 
            bg-gradient-to-r 
            text-transparent 
            bg-clip-text
            p-8 
            ${isDarkMode
                            ? "from-lime-400 to-emerald-500 shadow-lg shadow-emerald-700/30"
                            : "from-blue-600 to-indigo-500 shadow-md shadow-blue-800/20"
                        }
            transition-colors 
            duration-300
            tracking-tight
            animate-[gradient-text_5s_ease_infinite]
            bg-[200%_200%]
        `}
                >
                    Ollopa Internship.
                </h3>
                <p
                    className={`
            mt-4 
            text-sm 
            leading-relaxed 
            ${isDarkMode ? "text-gray-300" : "text-slate-600"}
            animate-[fade-in_0.5s_ease-out]
        `}
                >
                    Simplify internship attendance management with Ollopa's web app, providing a clear and efficient way to track and record intern hours.
                </p>

                {/* Buttons */}
                <div className="mt-10 flex flex-wrap items-center justify-center md:justify-start gap-4">
                    {isAuthenticated ? (
                        <Link
                            to="/dashboard"
                            className="px-5 py-2.5 rounded text-[15px] font-medium tracking-wide outline-none bg-blue-600 text-white hover:bg-blue-700 transition duration-300"
                        >
                            Get Started
                        </Link>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="px-5 py-2.5 rounded text-[15px] font-medium tracking-wide outline-none bg-blue-600 text-white hover:bg-blue-700 transition duration-300"
                            >
                                Log In
                            </Link>
                            <Link
                                to="/signup"
                                className="px-5 py-2.5 rounded text-[15px] font-medium tracking-wide outline-none bg-green-600 text-white hover:bg-green-700 transition duration-300"
                            >
                                Sign Up
                            </Link>

                        </>

                    )}
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
            </div>

            {/* Image Section */}
            <div className="md:h-[400px] relative">
                <img
                    src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="IT Internship Illustration"
                    className="w-full h-full object-cover rounded-xl shadow-lg custom-clip-path"
                />
            </div>
        </div>
    );
};

export default Landing;
