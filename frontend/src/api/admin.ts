const BASE = "/api/admin";

export interface PendingUser {
  id: number;
  email: string;
  name: string;
  gender: string;
  created_at: string;
}

// Fetch all users with status = 'pending'.
export async function getPendingUsers(token: string): Promise<PendingUser[]> {
  const res = await fetch(`${BASE}/users/pending`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to fetch pending users");
  return json.users;
}

// Approve a user (set status → 'active').
export async function approveUser(token: string, userId: number): Promise<void> {
  const res = await fetch(`${BASE}/users/${userId}/approve`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to approve user");
}

// Suspend a user (set status → 'suspended').
export async function suspendUser(token: string, userId: number): Promise<void> {
  const res = await fetch(`${BASE}/users/${userId}/suspend`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to suspend user");
}
