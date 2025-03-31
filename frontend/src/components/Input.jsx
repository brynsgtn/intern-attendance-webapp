import { useState } from "react";
const Input = ({ icon: Icon, isDarkMode, ...props }) => {;
  return (
    <div className='relative mb-6'>
      <div className={`absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none ${isDarkMode ? 'text-green-500' : 'text-gray-500'
        }`}>
        <Icon className="size-5" />
      </div>
      <input
        {...props}
        className={`w-full pl-10 pr-3 py-2 rounded-lg border focus:border-green-500 focus:ring-2 focus:ring-green-500  placeholder-gray-400 transition duration-200 ${isDarkMode
          ? 'bg-gray-800 border-gray-700 focus:ring-green-500 text-white'
          : 'bg-gray-200 border-gray-300 focus:ring-blue-500 text-gray-800'
          }`}
      />
    </div>
  )
}

export default Input