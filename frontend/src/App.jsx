import { useState, useEffect } from "react"
import FloatingShape from "./components/FloatingShape"
import { Routes, Route, Navigate } from "react-router-dom";
import SignUpPage from "./pages/SignUpPage";
import LogInPage from "./pages/LogInPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import { useAuthStore } from "./store/authStore";
import DashboardPage from "./pages/DashBoardPage";
import LoadingSpinner from "./components/LoadingSpinner";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import Header from "./components/Header";
import { Toaster } from "react-hot-toast";
import Footer from "./components/Footer";


// protect routes that require authentication
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />;
  }

  if (!user.isVerified) {
    return <Navigate to='/verify-email' replace />;
  }

  return children;
};


// redirect authenticated users to the home page
const RedirectAuthenticatedUser = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user.isVerified) {
    return <Navigate to='/' replace />;
  }

  return children;
};


function App() {
  // const [isDarkMode, setIsDarkMode] = useState(true);

  const { isCheckingAuth, checkAuth, isDarkMode, darkmode } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) return <LoadingSpinner />
  return (

    <div className={` bg-gradient-to-br ${isDarkMode ? "from-gray-900 via-green-900 to-emerald-900" : "from-gray-50 via-gray-400 to-gray-500"} h-screen flex items-center justify-center relative overflow-y-auto overflow-x-hidden`}>
    {/* <div className={` bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900 h-screen flex items-center justify-center relative overflow-hidden`}> */}
    
    <Toaster position="bottom-center" toastOptions={{
        style: {
          background: isDarkMode ? '#333' : '#fff',
          color: isDarkMode ? '#fff' : '#333',
        },
      }} />
      <FloatingShape color={isDarkMode ? 'bg-green-500' : 'bg-stone-800'} size="w-64 h-64" top="-5%" left="10%" delay={0} />
      <FloatingShape color={isDarkMode ? 'bg-green-500' : 'bg-stone-800'} size="w-48 h-48" top="70%" left="80%" delay={5} />
      <FloatingShape color={isDarkMode ? 'bg-green-500' : 'bg-stone-800'} size="w-32 h-32" top="40%" left="-10%" delay={2} />

			<Header />

      <Routes>
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>} />
        <Route path="/signup" element={
          <RedirectAuthenticatedUser>
            <SignUpPage />
          </RedirectAuthenticatedUser>
        }
        />
        <Route path="/login" element={
          <RedirectAuthenticatedUser>
          <LogInPage/>
          </RedirectAuthenticatedUser>
        } />
        <Route path="/verify-email" element={
          <RedirectAuthenticatedUser>
              <EmailVerificationPage/>
          </RedirectAuthenticatedUser>
           
        }/>
        <Route path='/forgot-password' element={
          <RedirectAuthenticatedUser>
            <ForgotPasswordPage/>
          </RedirectAuthenticatedUser>} />
        <Route
          path='/reset-password/:token' element={
            <RedirectAuthenticatedUser>
              <ResetPasswordPage/>
            </RedirectAuthenticatedUser>} />
        {/* catch all routes */}
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    
    </div>
  )
};

export default App
