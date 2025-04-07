import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import UserTable from "./UserTable";
import InternsTable from "./InternsTable";
import RequestTable from "./RequestsTable";
import TeamTable from "./TeamTable";

const TabMenu = ({refreshKey}) => {
  const [activeTab, setActiveTab] = useState("My Attendance");
  const { isDarkMode, user } = useAuthStore();

  // Determine which tabs to show based on role
  let tabs = [];
  if (user.isAdmin) {
    tabs = ["My Attendance", "Interns Attendance", "Edit Requests"];
  } else if (user.isTeamLeader) {
    tabs = ["My Attendance", "My Team Attendance"];
  } 

  // Render the appropriate component based on the active tab
  const renderActiveComponent = () => {
    switch (activeTab) {
      case "My Attendance":
        return <UserTable refreshKey={refreshKey} />;
      case "Interns Attendance":
        return <InternsTable />;
      case "My Team Attendance":
        return <TeamTable />
      case "Edit Requests":
        return <RequestTable />;
      default:
        return <UserTable />;
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`flex overflow-x-auto whitespace-nowrap mb-4 ml-2 border-b ${
          isDarkMode ? "border-gray-700" : "border-gray-300"
        }`}
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative inline-flex items-center px-4 py-2 text-sm sm:text-base font-medium transition-colors duration-300 rounded-t-md
              ${
                activeTab === tab
                  ? `${
                      isDarkMode
                        ? "text-green-400 bg-gray-800 border-gray-700"
                        : "text-blue-600 bg-white border-gray-300"
                    } border-x border-t`
                  : `${
                      isDarkMode
                        ? "text-gray-300 hover:text-green-400"
                        : "text-blue-500 hover:text-emerald-400"
                    }`
              }
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content area for the active tab */}
      <div
        className={`relative p-6 bg-opacity-50 rounded-lg ${
          isDarkMode ? "bg-gray-900 text-gray-300" : "bg-gray-200 text-gray-900"
        }`}
      >
        <h3
          className={`text-lg sm:text-xl font-semibold ${
            isDarkMode ? "text-emerald-500" : "text-blue-500"
          } mb-4`}
        >
          {activeTab}
        </h3>
        {renderActiveComponent()}
      </div>
    </div>
  );
};

export default TabMenu;