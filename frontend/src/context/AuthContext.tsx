import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getMe, type User } from "../api/auth";

// The shape of everything the context exposes to the rest of the app.
interface AuthContextValue {
  user: User | null;
  token: string | null;
  // Called by LoginPage after a successful login to store the session.
  setSession: (token: string, user: User) => void;
  // Clears the session — used by a logout button (built later).
  logout: () => void;
  // True while we're checking localStorage on first load.
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Wrap the whole app in this so every component can call useAuth().
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // On first load: check if there's a saved token in localStorage.
  // If there is, validate it against the backend. If it's still good,
  // restore the session. If not (expired, revoked), clear it silently.
  useEffect(() => {
    const saved = localStorage.getItem("token");
    if (!saved) {
      setLoading(false);
      return;
    }

    getMe(saved)
      .then((fetchedUser) => {
        setToken(saved);
        setUser(fetchedUser);
      })
      .catch(() => {
        // Token is stale — remove it so the user gets the login page.
        localStorage.removeItem("token");
      })
      .finally(() => setLoading(false));
  }, []); // empty array = run once when the component first mounts

  function setSession(newToken: string, newUser: User) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(newUser);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, setSession, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook — any component can do `const { user } = useAuth()`
// instead of importing AuthContext and calling useContext manually.
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
