import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/leaderboard");
  }

  return (
    <nav style={{
      height: "var(--nav-height)",
      borderBottom: "1px solid var(--border)",
      display: "flex",
      alignItems: "center",
      padding: "0 var(--gap-lg)",
      gap: "var(--gap-lg)",
      background: "var(--bg)",
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <NavLink to="/leaderboard" style={{
        fontWeight: 600,
        fontSize: "18px",
        color: "var(--text-strong)",
        letterSpacing: "-0.3px",
        marginRight: "var(--gap-sm)",
      }}>
        IronBoard
      </NavLink>

      {/* Nav links */}
      <div style={{ display: "flex", gap: "var(--gap-md)", flex: 1 }}>
        <NavItem to="/leaderboard">Leaderboard</NavItem>
        <NavItem to="/feed">Feed</NavItem>
        {user?.role === "admin" && <NavItem to="/admin">Admin</NavItem>}
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--gap-md)" }}>
        {user ? (
          <>
            <NavLink to="/profile" style={{ display: "flex", alignItems: "center" }}>
              <Avatar name={user.name} avatarUrl={user.avatar_url} size={30} />
            </NavLink>
            <button className="btn-ghost" onClick={handleLogout} style={{ fontSize: "var(--text-base)", padding: "4px 10px" }}>
              Log out
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" style={{ fontSize: "var(--text-base)", color: "var(--text)" }}>
              Log in
            </NavLink>
            <NavLink to="/register">
              <button className="btn-ghost" style={{ fontSize: "var(--text-base)", padding: "4px 10px" }}>
                Register
              </button>
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
}

// Small helper for nav links with active state.
function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        fontSize: "var(--text-base)",
        color: isActive ? "var(--text-strong)" : "var(--text)",
        transition: "color 0.15s",
      })}
    >
      {children}
    </NavLink>
  );
}
