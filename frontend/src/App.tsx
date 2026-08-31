import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import LeaderboardPage from "./pages/LeaderboardPage";

export default function App() {
  return (
    // AuthProvider wraps everything so any component can call useAuth().
    <AuthProvider>
      {/* BrowserRouter enables URL-based navigation throughout the app. */}
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          {/* Any unknown URL redirects to the leaderboard. */}
          <Route path="*" element={<Navigate to="/leaderboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
