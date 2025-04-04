import { useState } from "react";

const TabMenu = () => {
  const [activeTab, setActiveTab] = useState("Profile");

  const tabs = ["Profile", "Account", "Notification"];

  return (
    <div className="flex overflow-x-auto whitespace-nowrap mb-0 ml-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={`inline-flex items-center h-12 px-4 py-2 text-sm text-center sm:text-base whitespace-nowrap focus:outline-none 
            ${
              activeTab === tab
                ? "text-gray-700 border border-b-0 border-gray-300 dark:border-gray-500 rounded-t-md dark:text-white"
                : "text-gray-700 bg-transparent border-b border-gray-300 dark:border-gray-500 dark:text-white cursor-pointer hover:border-gray-400 dark:hover:border-gray-300"
            }`}
          onClick={() => setActiveTab(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default TabMenu;
