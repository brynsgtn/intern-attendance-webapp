import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore.js";
import { Sun, Moon, Menu, X, ChevronDown, Users, Pencil, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const Header = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { user, isDarkMode, darkmode, logout } = useAuthStore();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);  // Track scroll position



    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const logoutHandler = async () => {
        try {
            logout();
        } catch (err) {
            console.log(err);
        }
    };

    const getUserAvatar = () => {
        if (user && user.image) {
            return `http://localhost:3000/images/${user.image}`;  // Return full URL
        }
        return "/profile.png"; // Default avatar
    };


    // Scroll effect: Update `scrolled` state based on window scroll position
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 100) {
                setScrolled(true);  // Trigger scroll effect
            } else {
                setScrolled(false); // Reset scroll effect
            }
        };

        window.addEventListener("scroll", handleScroll);

        // Cleanup event listener on component unmount
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);
    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`fixed top-0 left-0 right-0 py-3 sm:py-4 px-4 sm:px-6 md:px-8 lg:px-10 
				${isDarkMode ? "bg-gray-900 bg-opacity-95" : "bg-gray-300 bg-opacity-80"} 
				${scrolled ? "bg-opacity-80 py-2" : "bg-opacity-95 py-3"}  // Modify opacity and padding on scroll
				backdrop-filter backdrop-blur-lg text-white font-[sans-serif] min-h-[70px] 
				tracking-wide z-50 transition-all duration-300`}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-5 w-full">
                <Link to='/'>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center"
                    >

                        <div
                            className={`h-8 w-8 rounded-md flex items-center justify-center mr-2 
            ${isDarkMode ? 'bg-gradient-to-r from-green-400 to-emerald-600 ' : 'bg-gradient-to-r from-blue-600 to-blue-500'}`}
                        >
                            <span className="text-white font-bold">
                                O
                            </span>
                        </div>
                        <span
                            className={`block font-semibold text-lg md:text-xl 
		${isDarkMode ? "bg-gradient-to-r from-green-400 to-emerald-600 text-transparent bg-clip-text hover:text-white" : "bg-gradient-to-r from-blue-600 to-blue-500 text-transparent bg-clip-text hover:text-emerald-500"}`}
                        >
                            Ollopa Internship
                        </span>

                    </motion.div>
                </Link>

                {/* Mobile Menu Button */}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    className={`lg:hidden ${isDarkMode ? 'text-emerald-500' : 'text-blue-500'}`}
                    onClick={toggleMenu}
                    aria-label="Menu"
                >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </motion.button>

                {/* Desktop & Mobile Navigation */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, x: "-100%" }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: "-100%" }}
                            transition={{ type: "tween", duration: 0.3 }}
                            className={`fixed inset-0 lg:hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-300'} bg-opacity-0 z-50 pt-20 px-6 min-h-screen h-full`}
                        >
                            {/* Close button for mobile */}
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                className={`absolute top-4 right-4 ${isDarkMode ? 'text-emerald-500' : 'text-blue-500'} p-2`}
                                onClick={toggleMenu}
                                aria-label="Close Menu"
                            >
                                <X size={24} />
                            </motion.button>

                            <motion.ul
                                className="space-y-5"
                                initial="closed"
                                animate="open"
                                variants={{
                                    open: { transition: { staggerChildren: 0.1 } },
                                    closed: {}
                                }}
                            >
                                <motion.li
                                    variants={{
                                        open: { opacity: 1, y: 0 },
                                        closed: { opacity: 0, y: 20 }
                                    }}
                                    onClick={darkmode}
                                    className={`flex items-center p-3 rounded-xl bg-opacity-60 hover:bg-opacity-80 ${isDarkMode ? 'bg-gray-800 text-emerald-500' : 'bg-gray-200 text-blue-500'} cursor-pointer`}
                                >
                                    {isDarkMode ? <Sun size={18} className="mr-3" /> : <Moon size={18} className="mr-3" />}
                                    {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                                </motion.li>

                                {user && (
                                    <>
                                        <motion.li
                                            variants={{
                                                open: { opacity: 1, y: 0 },
                                                closed: { opacity: 0, y: 20 }
                                            }}
                                        >
                                            <div className={`flex items-center p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} bg-opacity-60 mb-4`}>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-2 ${isDarkMode ? 'bg-white' : 'bg-gray-300'}`}>
                                                    <img
                                                        src={getUserAvatar()}  // Get the user avatar (either profile or default)
                                                        alt="User Avatar"
                                                        className="w-full h-full rounded-full object-cover"  // Ensures the image is round and fits well
                                                    />
                                                </div>

                                                <div>
                                                    <p className={`font-medium ${isDarkMode ? 'text-emerald-500' : 'text-blue-500'} `}>{user.full_name}</p>
                                                    <p className={`text-sm ${isDarkMode ? 'text-emerald-500' : 'text-blue-500'} `}>{user.email}</p>
                                                </div>
                                            </div>
                                        </motion.li>

                                        <motion.li
                                            variants={{
                                                open: { opacity: 1, y: 0 },
                                                closed: { opacity: 0, y: 20 }
                                            }}
                                        >
                                        </motion.li>

                                        {user.isAdmin && (
                                            <>
                                                <motion.li
                                                    variants={{
                                                        open: { opacity: 1, y: 0 },
                                                        closed: { opacity: 0, y: 20 }
                                                    }}
                                                >
                                                    <Link
                                                        to="/users"
                                                        onClick={() => setIsOpen(false)}
                                                        className={`flex items-center p-3 rounded-xl bg-opacity-60 hover:bg-opacity-80 ${isDarkMode ? 'bg-gray-800 text-emerald-500' : 'bg-gray-200 text-blue-500'}`}
                                                    >
                                                        <Users className="w-5 h-5 mr-3" />
                                                        Manage Users
                                                    </Link>
                                                </motion.li>
                                                <motion.li
                                                    variants={{
                                                        open: { opacity: 1, y: 0 },
                                                        closed: { opacity: 0, y: 20 }
                                                    }}
                                                >
                                                </motion.li>
                                            </>
                                        )}

                                        <motion.li
                                            variants={{
                                                open: { opacity: 1, y: 0 },
                                                closed: { opacity: 0, y: 20 }
                                            }}
                                        >
                                            <button
                                                onClick={() => {
                                                    logoutHandler();
                                                    setIsOpen(false);
                                                }}
                                                className={`w-full flex items-center p-3 rounded-xl bg-opacity-60 hover:bg-opacity-80 ${isDarkMode ? 'bg-gray-800 text-emerald-500' : 'bg-gray-200 text-blue-500'}`}
                                            >
                                                <LogOut className="w-5 h-5 mr-3" />
                                                Logout
                                            </button>
                                        </motion.li>

                                    </>
                                )}

                                {!user && (
                                    <>
                                    </>
                                )}
                            </motion.ul>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Desktop Controls */}
                <div className="hidden lg:flex items-center space-x-5">
                    {/* Theme Toggle */}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={darkmode}
                        className={`p-2 rounded-full ${isDarkMode ? 'text-emerald-500 bg-gray-900  hover:text-white' : 'text-blue-500 bg-gray-300 hover:text-emerald-500'} hover:cursor-pointer`}
                        aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </motion.button>

                    {user ? (
                        <div className="relative">
                            {/* User Profile Dropdown with Avatar */}
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center px-3 py-2 text-sm font-medium text-gray-300 cursor-pointer hover:text-white rounded-lg border-nonetransition-all"
                                onClick={toggleDropdown}
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r flex items-center justify-center text-white font-bold mr-2">
                                    <img
                                        src={getUserAvatar()}  // Get the user avatar (either profile or default)
                                        alt="User Avatar"
                                        className="w-full h-full rounded-full object-cover"  // Ensures the image is round and fits well
                                    />
                                </div>

                                <ChevronDown className={`ml-1 w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : "rotate-0"} ${isDarkMode ? 'text-emerald-500 bg-gray-900 hover:text-white' : 'text-blue-500 bg-gray-300 hover:text-emerald-500'}`} />
                            </motion.div>

                            {/* Dropdown Menu */}
                            <AnimatePresence>
                                {isDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className={`absolute right-0 w-56 ${isDarkMode ? 'bg-gray-900  border-gray-700' : 'bg-gray-300 border-gray-200'}  shadow-xl rounded-xl overflow-hidden mt-2 z-50 border border-gray-700`}
                                    >
                                        <div className="p-3 border-b border-gray-700">
                                            <p className={`font-medium ${isDarkMode ? 'text-emerald-500' : 'text-blue-500'}`}>{user.last_name}, {user.first_name}</p>
                                            <p className={`text-sm ${isDarkMode ? 'text-emerald-500' : 'text-blue-400'} truncate`}>{user.email}</p>
                                        </div>
                                        <div className="py-1">

                                            {user.isAdmin && (
                                                <>
                                                    <Link
                                                        to="/dashboard"
                                                        onClick={() => setIsDropdownOpen(false)}
                                                        className={`flex items-center p-4 text-sm  transition-all border-b border-gray-700 ${isDarkMode ? 'bg-gray-800 text-emerald-500 text-gray-300 hover:bg-gray-700 hover:text-green-400' : 'bg-gray-300 text-blue-500 hover:bg-blue-700 hover:text-white'}`}
                                                    >
                                                        <Users className="w-5 h-5 mr-3" />
                                                        Dashboard
                                                    </Link>
                                                </>

                                            )}
                                        </div>

                                        <div className="py-1">

                                            {user.isAdmin && (
                                                <>
                                                    <Link
                                                        to="/users"
                                                        onClick={() => setIsDropdownOpen(false)}
                                                        className={`flex items-center p-4 text-sm  transition-all border-b border-gray-700 ${isDarkMode ? 'bg-gray-800 text-emerald-500 text-gray-300 hover:bg-gray-700 hover:text-green-400' : 'bg-gray-300 text-blue-500 hover:bg-blue-700 hover:text-white'}`}
                                                    >
                                                        <Users className="w-5 h-5 mr-3" />
                                                        Manage Users
                                                    </Link>
                                                </>

                                            )}
                                        </div>

                                        <div>
                                            <button
                                                onClick={() => {
                                                    logoutHandler();
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={`flex items-center w-full text-left px-4 py-2 text-sm ${isDarkMode ? 'bg-gray-800 text-emerald-500 text-gray-300 hover:bg-gray-700 hover:text-green-400' : 'bg-gray-300 text-blue-500 hover:bg-blue-700 hover:text-white'} transition-all hover:cursor-pointer`}
                                            >
                                                <LogOut className="w-5 h-5 mr-3" />
                                                Logout
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="flex space-x-3">

                        </div>
                    )}
                </div>
            </div>
        </motion.header>
    );
};

export default Header;