import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "react-hot-toast";

// Layouts
import AdminLayout from "./layouts/AdminLayout";
import StudentLayout from "./layouts/StudentLayout";

// Views (Auth)
import Login from "./views/auth/Login";
import Register from "./views/auth/Register";
import ForgotPassword from "./views/auth/ForgotPassword";
import ResetPassword from "./views/auth/ResetPassword";
import NotFound from "./views/NotFound";

// Views (Admin)
import AdminDashboard from "./views/admin/Dashboard";
import ManageQuizzes from "./views/admin/Quizzes";
import ManageQuestions from "./views/admin/Questions";
import ManageCategories from "./views/admin/Categories";
import ManageUsers from "./views/admin/Users";
import AdminLeaderboard from "./views/admin/Leaderboard";

// Views (Student)
import StudentDashboard from "./views/student/Dashboard";
import ExploreQuizzes from "./views/student/Quizzes";
import QuizAttempt from "./views/student/QuizAttempt";
import PreviousAttempts from "./views/student/PreviousAttempts";
import QuizResults from "./views/student/Results";
import StudentLeaderboard from "./views/student/Leaderboard";
import Profile from "./views/student/Profile";

import ErrorBoundary from "./components/ErrorBoundary";

// Root redirect router helper
const RootRedirect = () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (token && role) {
    return role === "admin" 
      ? <Navigate to="/admin/dashboard" replace /> 
      : <Navigate to="/student/dashboard" replace />;
  }
  return <Navigate to="/login" replace />;
};

// Route protection filter components
const RequireAuth = ({ allowedRole, children }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && role !== allowedRole) {
    // If mismatch, bounce to login or root redirects
    return <Navigate to="/" replace />;
  }

  return <ErrorBoundary>{children}</ErrorBoundary>;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected Admin routes */}
            <Route
              path="/admin"
              element={
                <RequireAuth allowedRole="admin">
                  <AdminLayout />
                </RequireAuth>
              }
            >
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="quizzes" element={<ManageQuizzes />} />
              <Route path="quizzes/:quizId/questions" element={<ManageQuestions />} />
              <Route path="categories" element={<ManageCategories />} />
              <Route path="users" element={<ManageUsers />} />
              <Route path="leaderboard" element={<AdminLeaderboard />} />
            </Route>

            {/* Protected Student routes */}
            <Route
              path="/student"
              element={
                <RequireAuth allowedRole="student">
                  <StudentLayout />
                </RequireAuth>
              }
            >
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="quizzes" element={<ExploreQuizzes />} />
              <Route path="quizzes/:quizId/attempt" element={<QuizAttempt />} />
              <Route path="attempts" element={<PreviousAttempts />} />
              <Route path="attempts/:attemptId/review" element={<QuizResults />} />
              <Route path="leaderboard" element={<StudentLeaderboard />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* fallback 404 router */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" reverseOrder={false} />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
