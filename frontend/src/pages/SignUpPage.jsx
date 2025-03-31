import { motion } from "framer-motion";
import Input from "../components/Input";
import { User, Mail, School, Users, Hourglass, Loader } from "lucide-react";
import { useState } from "react";
import Dropdown from "../components/Dropdown";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import { Link, useNavigate } from "react-router-dom";
import PasswordInput from "../components/PasswordInput";
import { useAuthStore } from "../store/authStore";

const SignUpPage = () => {
    const [firstName, setFirstName] = useState('');
    const [middleInitial, setMiddleInitial] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [school, setSchool] = useState('');
    const [requiredHours, setRequiredHours] = useState('');
    const [team, setTeam] = useState('');
    const navigate = useNavigate();

    const { signup, error, isLoading, clearError, isDarkMode } = useAuthStore();

    const confirmedPassword = password === confirmPassword;

    const handleSignup = async (e) => {
        e.preventDefault();
        try {
            await signup(firstName, middleInitial, lastName, email, password, school, requiredHours, team);
            navigate("/verify-email");
        } catch (error) {
            console.log(error.response.data); // Handle API errors
        }
    }

    const teamOptions = [
        { value: "Team 1", label: "Team 1" },
        { value: "Team 2", label: "Team 2" },
        { value: "Team 3", label: "Team 3" },
        { value: "Team 4", label: "Team 4" },
        { value: "Team 5", label: "Team 5" },
        { value: "Team 6", label: "Team 6" },
        { value: "Team 7", label: "Team 7" },
        // Add more teams here as needed
    ];

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`max-w-4xl w-full ${isDarkMode ? 'bg-gray-900' : 'bg-white text-gray-800'} bg-opacity-80  rounded-2xl shadow-xl overflow-hidden`}
            >
                <div className="p-8">
                    <h2 className={`text-3xl font-bold mb-10 text-center bg-gradient-to-r ${isDarkMode ? 'from-green-400 to-emerald-500' : 'from-blue-600 to-blue-500'} text-transparent bg-clip-text`}>
                        Create Account
                    </h2>

                    <form onSubmit={handleSignup}>
                        {/* Small screen layout */}
                        <div className="grid grid-cols-1 gap-y-1 md:hidden">
                            {/* Name inputs (3 columns on sm screens) */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
                                <Input
                                    icon={User}
                                    type="text"
                                    name="first_name"
                                    placeholder="First Name"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    isDarkMode={isDarkMode}
                                    required
                                />

                                <Input
                                    icon={User}
                                    type="text"
                                    name="middle_initial"
                                    placeholder="Middle Initial"
                                    value={middleInitial}
                                    onChange={(e) => setMiddleInitial(e.target.value)}
                                    isDarkMode={isDarkMode}
                                />

                                <Input
                                    icon={User}
                                    type="text"
                                    name="last_name"
                                    placeholder="Last Name"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    isDarkMode={isDarkMode}
                                    required
                                />
                            </div>

                            <Input
                                icon={Mail}
                                type="email"
                                name="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                isDarkMode={isDarkMode}
                                required
                            />

                            {/* Password followed by confirm password on small screens */}
                            <PasswordInput
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                isDarkMode={isDarkMode}
                                required
                            />

                            <PasswordInput
                                type="password"
                                name="confirm_password"
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                isDarkMode={isDarkMode}
                                required
                            />

                            <Input
                                icon={School}
                                type="text"
                                name="school"
                                placeholder="School"
                                value={school}
                                onChange={(e) => setSchool(e.target.value)}
                                isDarkMode={isDarkMode}
                                required
                            />

                            <Input
                                icon={Hourglass}
                                type="number"
                                name="required_hours"
                                placeholder="Required Hours"
                                value={requiredHours}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === "" || Number(value) >= 0) {
                                        setRequiredHours(value);
                                    }
                                }}
                                isDarkMode={isDarkMode}
                                required
                            />

                            <Dropdown
                                icon={Users}
                                name="team"
                                options={teamOptions}
                                value={team}
                                onChange={(e) => setTeam(e.target.value)}
                                isDarkMode={isDarkMode}
                                required
                            />
                        </div>

                        {/* Medium and larger screen layout - same as previous implementation */}
                        <div className="hidden md:grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-x-4 gap-y-1">
                            {/* Name inputs */}
                            <Input
                                icon={User}
                                type="text"
                                name="first_name"
                                placeholder="First Name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                isDarkMode={isDarkMode}
                                required
                            />

                            <Input
                                icon={User}
                                type="text"
                                name="middle_initial"
                                placeholder="Middle Initial"
                                value={middleInitial}
                                onChange={(e) => setMiddleInitial(e.target.value)}
                                isDarkMode={isDarkMode}
                            />

                            <Input
                                icon={User}
                                type="text"
                                name="last_name"
                                placeholder="Last Name"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                isDarkMode={isDarkMode}
                                required
                            />

                            {/* Email and password inputs - 2 columns */}
                            <div className="col-span-3 grid grid-cols-2 gap-x-4">
                                <Input
                                    icon={Mail}
                                    type="email"
                                    name="email"
                                    placeholder="Email Address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    isDarkMode={isDarkMode}
                                    required
                                />
                                <PasswordInput
                                    type="password"
                                    name="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    isDarkMode={isDarkMode}
                                    required
                                />
                            </div>

                            {/* School spans full width */}
                            <div className="col-span-3">
                                <Input
                                    icon={School}
                                    type="text"
                                    name="school"
                                    placeholder="School"
                                    value={school}
                                    onChange={(e) => setSchool(e.target.value)}
                                    isDarkMode={isDarkMode}
                                    required
                                />
                            </div>

                            {/* Confirm password, hours and team */}
                            <div className="col-span-3 grid grid-cols-3 gap-x-4">
                                <PasswordInput
                                    type="password"
                                    name="confirm_password"
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    isDarkMode={isDarkMode}
                                    required
                                />
                                <Input
                                    icon={Hourglass}
                                    type="number"
                                    name="required_hours"
                                    placeholder="Required Hours"
                                    value={requiredHours}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === "" || Number(value) >= 0) {
                                            setRequiredHours(value);
                                        }
                                    }}
                                    isDarkMode={isDarkMode}
                                    required
                                />
                                <Dropdown
                                    icon={Users}
                                    name="team"
                                    options={teamOptions}
                                    value={team}
                                    onChange={(e) => setTeam(e.target.value)}
                                    isDarkMode={isDarkMode}
                                    required
                                />
                            </div>
                        </div>

                        {error && <p className="text-red-500 font-semibold mt-2">{error}</p>}
                        {!confirmedPassword && <p className="text-red-500 font-semibold mt-2">Passwords do not match!</p>}
                        <PasswordStrengthMeter password={password} isDarkMode={isDarkMode} />

                        <motion.button
                            className={`mt-5 w-full py-3 px-4 font-bold rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-200
    ${isDarkMode
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 focus:ring-green-500'
                                    : 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white hover:from-blue-500 hover:to-indigo-600 focus:ring-blue-500'
                                }
    ${!confirmedPassword ? 'cursor-not-allowed hover:bg-gray-400' : ''}
    `}
                            type="submit"
                            disabled={!confirmedPassword || isLoading}
                        >
                            {isLoading ? <Loader className="animate-spin mx-auto" size={24} /> : "Sign Up"}
                        </motion.button>



                    </form>
                </div>
                <div className={`px-8 py-4 flex justify-center ${isDarkMode ? "bg-gray-900 bg-opacity-50" : "bg-gray-200"}`}>
                    <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        Already have an account?{" "}
                        <Link to={'/login'} onClick={clearError} className={`${isDarkMode ? "text-green-400 hover:underline" : "text-blue-600 hover:underline"}`}>
                            Login
                        </Link>
                    </p>
                </div>
            </motion.div>
        </>
    );
};

export default SignUpPage;