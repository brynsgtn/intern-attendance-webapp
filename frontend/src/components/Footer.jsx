import React from "react";
import { Link } from "react-router-dom";
import { FaReddit, FaFacebookF, FaGithub } from "react-icons/fa";
import { useAuthStore } from "../store/authStore";

const Footer = () => {
  const { isDarkMode } = useAuthStore();

  return (
    <footer className={`
      bg-white 
      text-gray-700 
      dark:bg-gray-900 
      dark:text-gray-300 
      border-t 
      border-gray-200 
      dark:border-gray-700 
      py-12
    `}>
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center text-center mb-8">
          <p className={`
            block 
            font-extrabold 
            text-2xl 
            md:text-3xl 
            bg-gradient-to-r 
            text-transparent 
            bg-clip-text 
            ${isDarkMode
              ? "from-lime-400 to-emerald-500 hover:text-white"
              : "from-blue-600 to-indigo-500 hover:text-emerald-500"
            }
            transition-colors duration-300
          `}>
            Ollopa Corporation
          </p>

          <div className="flex flex-wrap justify-center mt-6 gap-x-6 gap-y-3 text-sm">
            <a
              href="https://www.egetinnz.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
            >
              eGetinnz
            </a>
            <a
              href="https://fibeidigicards.com/home"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
            >
              FibeiDigiCards
            </a>
            <a
              href="https://fibeigreetings.com/new/cards/all"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
            >
              FibeiGreetings
            </a>
          </div>
        </div>

        <hr className="my-8 border-gray-300 dark:border-gray-700" />
        <div>
          <p className={`
        text-sm 
        text-center 
        ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}
        font-medium
    `}>
            © {new Date().getFullYear()}
            <a
              href="https://brynsgtn-webportfolio.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className={`
                ${isDarkMode ? 'text-emerald-400 hover:text-emerald-600' : 'text-blue-600 hover:text-blue-700'} 
                font-semibold
                transition-colors duration-200
                text-decoration-none
                text-xl
            `}
            >
              &nbsp;&nbsp;&lt;brynsgtn/&gt;&nbsp;&nbsp;
            </a>
            . All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;