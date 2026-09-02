import { useState } from "react";
import { Link } from "react-router-dom";
import { register } from "../api/auth";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register({ name, email, password, gender });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="page">
        <div style={{ width: "min(480px, 90%)", marginLeft: "auto", marginRight: "auto" }}>
          <h1>You're on the list</h1>
          <p style={{ marginBottom: "var(--gap-lg)" }}>
            Your account is pending admin approval. You'll be able to log in once it's approved.
          </p>
          <Link to="/login" style={{ textDecoration: "underline" }}>Back to login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ width: "min(480px, 90%)", margin: "0 auto" }}>
        <h1>Create account</h1>
        <form onSubmit={handleSubmit} className="form-stack">
          <div className="form-row">
            <label htmlFor="name">Name</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
          </div>
          <div className="form-row">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="form-row">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
          </div>
          <fieldset>
            <legend>Gender</legend>
            <div style={{ display: "flex", gap: "var(--gap-lg)", marginTop: "var(--gap-xs)" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "var(--gap-xs)", marginBottom: 0 }}>
                <input type="radio" name="gender" value="male" checked={gender === "male"} onChange={() => setGender("male")} />
                Male
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "var(--gap-xs)", marginBottom: 0 }}>
                <input type="radio" name="gender" value="female" checked={gender === "female"} onChange={() => setGender("female")} />
                Female
              </label>
            </div>
          </fieldset>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? "Registering…" : "Register"}
          </button>
        </form>
        <p style={{ marginTop: "var(--gap-lg)", fontSize: "var(--text-sm)", color: "var(--text)" }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
