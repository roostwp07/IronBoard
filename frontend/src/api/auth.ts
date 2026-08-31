// Relative URL — Vite's dev proxy forwards /api/* to http://localhost:3000.
const BASE = "/api/auth";

// Shape of the user object the backend returns
export interface User {
  id: number;
  email: string;
  name: string;
  gender: string;
  role: "member" | "admin";
  status: string;
}

// --- register ---
// Sends name, email, password, gender to the backend.
// Returns the new user (status: "pending" — not yet active).
export async function register(data: {
  name: string;
  email: string;
  password: string;
  gender: "male" | "female";
}): Promise<User> {
  const res = await fetch(`${BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Registration failed");
  return json.user;
}

// --- login ---
// Sends email + password, gets back a JWT token and the user object.
export async function login(data: {
  email: string;
  password: string;
}): Promise<{ token: string; user: User }> {
  const res = await fetch(`${BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Login failed");
  return json; // { token, user }
}

// --- getMe ---
// Sends the stored token, gets back the current user's fresh data.
// Used to verify a token is still valid on app load.
export async function getMe(token: string): Promise<User> {
  const res = await fetch(`${BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Not authenticated");
  return json.user;
}
