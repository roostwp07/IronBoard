import { useState } from "react";
import { Link } from "react-router-dom";
import { register } from "../api/auth";

export default function RegisterPage() {
  // One state value per form field.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");

  // Tracks the in-flight request so we can disable the button.
  const [loading, setLoading] = useState(false);
  // Shown when the backend returns an error (e.g. email already taken).
  const [error, setError] = useState<string | null>(null);
  // Shown on success — registration requires admin approval, so we
  // don't log the user in; we just show a confirmation message.
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: { preventDefault(): void }) {
    // Prevent the default browser form submission (which would reload the page).
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await register({ name, email, password, gender });
      setSuccess(true);  // triggers a re-render, i.e. re-runs RegisterPage() function, by updating state
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // After successful registration, replace the form with a message.
  if (success) {
    return (
      <main style={{ maxWidth: 400, margin: "80px auto", padding: "0 16px" }}>
        <h1>You're on the list</h1>
        <p>
          Your account is pending admin approval. You'll be able to log in once
          it's approved.
        </p>
        <Link to="/login">Back to login</Link>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 400, margin: "80px auto", padding: "0 16px" }}>
      <h1>Create account</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label>
          Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            style={{ display: "block", width: "100%", marginTop: 4 }}
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{ display: "block", width: "100%", marginTop: 4 }}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            style={{ display: "block", width: "100%", marginTop: 4 }}
          />
        </label>

        <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
          <legend>Gender</legend>
          <label style={{ marginRight: 16 }}>
            <input
              type="radio"
              name="gender"
              value="male"
              checked={gender === "male"}
              onChange={() => setGender("male")}
            />{" "}
            Male
          </label>
          <label>
            <input
              type="radio"
              name="gender"
              value="female"
              checked={gender === "female"}
              onChange={() => setGender("female")}
            />{" "}
            Female
          </label>
        </fieldset>

        {/* Show backend error inline so the user knows what went wrong */}
        {error && <p style={{ color: "red", margin: 0 }}>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Registering…" : "Register"}
        </button>
      </form>

      <p style={{ marginTop: 16 }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </main>
  );
}
