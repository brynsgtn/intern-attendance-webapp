import { useState } from "react";

const Dropdown = ({ icon: Icon, options, value, onChange, isDarkMode, ...props }) => {


  return (
    <div className='relative mb-6'>
      <div className={`absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none ${isDarkMode ? 'text-green-500' : 'text-gray-500'}`}>
        <Icon className="size-5" />
      </div>
      <select
        {...props}
        value={value}
        onChange={onChange}
        className={`w-full pl-10 pr-3 py-2 rounded-lg border focus:border-green-500 focus:ring-2 focus:ring-green-500 text-gray-800 placeholder-gray-400 transition duration-200 cursor-pointer ${isDarkMode
          ? 'bg-gray-800 border-gray-700 focus:ring-green-500 text-white'
          : 'bg-gray-200 border-gray-300 focus:ring-blue-500 text-gray-800'
          }`}
      >
        <option value="">Select Team</option>
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Dropdown;
