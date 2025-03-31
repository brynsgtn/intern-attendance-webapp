import { useState } from "react";
import Input from "./Input";
import { Lock, Eye, EyeOff } from "lucide-react";

const PasswordInput = ({ placeholder, value, onChange, isDarkMode }) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="relative">
            <Input
                icon={Lock}
                type={showPassword ? "text" : "password"} // Toggle between text and password type
                name={placeholder.toLowerCase().replace(" ", "_")} // Use dynamic name from placeholder
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                isDarkMode={isDarkMode}
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
               className="absolute right-4 top-2/7 transform -translate-y-1/4 text-gray-500 hover:text-gray-700 cursor-pointer"
            >
                {showPassword ? (
                    <EyeOff className="w-5 h-5" /> // EyeOff icon when password is visible
                ) : (
                    <Eye className="w-5 h-5" /> // Eye icon when password is hidden
                )}
            </button>
        </div>
    );
};

export default PasswordInput;
