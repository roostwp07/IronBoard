import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import AdminPage from "./pages/AdminPage";
import LogLiftPage from "./pages/LogLiftPage";
import FeedPage from "./pages/FeedPage";
import ProfilePage from "./pages/ProfilePage";

export default function App() {
  return (
    // AuthProvider wraps everything so any component can call useAuth().
    <AuthProvider>
      {/* BrowserRouter enables URL-based navigation throughout the app. */}
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* Public routes */}
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/feed" element={<FeedPage />} />

          {/* Member-only routes */}
          <Route path="/log-lift" element={
            <ProtectedRoute><LogLiftPage /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><ProfilePage /></ProtectedRoute>
          } />

          {/* Admin-only routes */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>
          } />

          {/* Any unknown URL redirects to the leaderboard. */}
          <Route path="*" element={<Navigate to="/leaderboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
