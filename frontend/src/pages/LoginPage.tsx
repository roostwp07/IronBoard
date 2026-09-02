import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setSession } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { token, user } = await login({ email, password });
      setSession(token, user);
      navigate("/leaderboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div style={{ width: "min(480px, 90%)", margin: "0 auto" }}>
        <h1>Log in</h1>
        <form onSubmit={handleSubmit} className="form-stack">
          <div className="form-row">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="form-row">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>
        <p style={{ marginTop: "var(--gap-lg)", fontSize: "var(--text-sm)", color: "var(--text)" }}>
          No account yet? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
