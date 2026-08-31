import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  // If true, also requires the user to be an admin.
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly = false }: Props) {
  const { user, loading } = useAuth();

  // While AuthContext is validating a saved token on first load,
  // render nothing — avoids a flash of the login redirect.
  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/leaderboard" replace />;
  }

  return <>{children}</>;
}
