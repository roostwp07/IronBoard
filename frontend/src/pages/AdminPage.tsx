import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getPendingUsers,
  approveUser,
  suspendUser,
  type PendingUser,
} from "../api/admin";
import {
  getPendingLifts,
  approveLift,
  rejectLift,
  type PendingSubmission,
} from "../api/lifts";

export default function AdminPage() {
  const { user, token } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [pendingLifts, setPendingLifts] = useState<PendingSubmission[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([getPendingUsers(token), getPendingLifts(token)])
      .then(([users, lifts]) => {
        setPendingUsers(users);
        setPendingLifts(lifts);
      })
      .catch((err) => setError(err.message));
  }, [token]);

  if (!user || user.role !== "admin") {
    return <main style={{ padding: 32 }}><p>Access denied.</p></main>;
  }

  async function handleApproveUser(userId: number) {
    try {
      await approveUser(token!, userId);
      setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  async function handleSuspendUser(userId: number) {
    try {
      await suspendUser(token!, userId);
      setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  async function handleApproveLift(id: number) {
    try {
      await approveLift(token!, id);
      setPendingLifts((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  async function handleRejectLift(id: number) {
    try {
      await rejectLift(token!, id);
      setPendingLifts((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 32 }}>
      <h1>Admin Panel</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* ── Pending registrations ── */}
      <section style={{ marginBottom: 48 }}>
        <h2>Pending Registrations</h2>
        {pendingUsers.length === 0 ? (
          <p>No pending registrations.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Name</th>
                <th style={th}>Email</th>
                <th style={th}>Gender</th>
                <th style={th}>Registered</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map((u) => (
                <tr key={u.id}>
                  <td style={td}>{u.name}</td>
                  <td style={td}>{u.email}</td>
                  <td style={td}>{u.gender}</td>
                  <td style={td}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td style={td}>
                    <button onClick={() => handleApproveUser(u.id)} style={{ marginRight: 8 }}>
                      Approve
                    </button>
                    <button onClick={() => handleSuspendUser(u.id)}>
                      Suspend
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ── Pending lift submissions ── */}
      <section>
        <h2>Pending Lift Submissions</h2>
        {pendingLifts.length === 0 ? (
          <p>No pending lift submissions.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Member</th>
                <th style={th}>Lift</th>
                <th style={th}>Result</th>
                <th style={th}>Weight class</th>
                <th style={th}>Videos</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingLifts.map((l) => (
                <tr key={l.id}>
                  <td style={td}>{l.user_name}</td>
                  <td style={td}>{l.lift_type}</td>
                  <td style={td}>
                    {l.weight_kg !== null ? `${l.weight_kg}kg` : `${l.reps} reps`}
                  </td>
                  <td style={td}>{l.weight_class}</td>
                  <td style={td}>
                    <a href={l.scale_video_url} target="_blank" rel="noreferrer" style={{ marginRight: 8 }}>
                      Scale
                    </a>
                    <a href={l.lift_video_url} target="_blank" rel="noreferrer">
                      Lift
                    </a>
                  </td>
                  <td style={td}>
                    <button onClick={() => handleApproveLift(l.id)} style={{ marginRight: 8 }}>
                      Approve
                    </button>
                    <button onClick={() => handleRejectLift(l.id)}>
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #ccc",
  padding: "8px 12px",
};
const td: React.CSSProperties = {
  padding: "8px 12px",
  borderBottom: "1px solid #eee",
};
