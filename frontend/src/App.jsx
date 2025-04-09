import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import FloatingShape from "./components/FloatingShape";
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
import Landing from "./pages/Landing";
import UsersPage from "./pages/UsersPage";

// protect routes that require authentication
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user.isVerified) return <Navigate to="/verify-email" replace />;
  return children;
};

// redirect authenticated users to the home page
const RedirectAuthenticatedUser = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated && user.isVerified) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  const { isCheckingAuth, checkAuth, isDarkMode } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Paths that should not show the header
  const noHeaderandFooterPaths = ["/", "/signup", "/login", "/verify-email", "/forgot-password"];
  const shouldShowHeaderandFooter = !noHeaderandFooterPaths.includes(location.pathname)&&
  !location.pathname.startsWith("/reset-password/");;

  if (isCheckingAuth) return <LoadingSpinner />;

  return (
    <div
      className={`min-h-screen flex flex-col justify-between + overflow-hidden relative ${isDarkMode
          ? "bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900"
          : "bg-gradient-to-br from-gray-50 via-gray-400 to-gray-500"
        }`}
    >
      {/* Floating Background Shapes */}
      <FloatingShape
        color={isDarkMode ? "bg-green-500" : "bg-stone-800"}
        size="w-64 h-64"
        top="-5%"
        left="10%"
        delay={0}
      />
      <FloatingShape
        color={isDarkMode ? "bg-green-500" : "bg-stone-800"}
        size="w-48 h-48"
        top="70%"
        left="80%"
        delay={5}
      />
      <FloatingShape
        color={isDarkMode ? "bg-green-500" : "bg-stone-800"}
        size="w-32 h-32"
        top="40%"
        left="-10%"
        delay={2}
      />

      {shouldShowHeaderandFooter && <Header />}


      <main className="flex-grow flex items-center justify-center relative overflow-y-auto overflow-x-hidden">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/users" element={

            <ProtectedRoute>
            <UsersPage />
           
            </ProtectedRoute>
          }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <RedirectAuthenticatedUser>
                <SignUpPage />
              </RedirectAuthenticatedUser>
            }
          />
          <Route
            path="/login"
            element={
              <RedirectAuthenticatedUser>
                <LogInPage />
              </RedirectAuthenticatedUser>
            }
          />
          <Route
            path="/verify-email"
            element={
              <RedirectAuthenticatedUser>
                <EmailVerificationPage />
              </RedirectAuthenticatedUser>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <RedirectAuthenticatedUser>
                <ForgotPasswordPage />
              </RedirectAuthenticatedUser>
            }
          />
          <Route
            path="/reset-password/:token"
            element={
              <RedirectAuthenticatedUser>
                <ResetPasswordPage />
              </RedirectAuthenticatedUser>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

      </main>

      {shouldShowHeaderandFooter && <Footer />}

      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: isDarkMode ? "#333" : "#fff",
            color: isDarkMode ? "#fff" : "#333",
          },
        }}
      />
    </div>
  );
}

export default App;
