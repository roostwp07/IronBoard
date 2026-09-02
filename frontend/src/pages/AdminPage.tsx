import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getPendingUsers, approveUser, suspendUser, type PendingUser } from "../api/admin";
import { getPendingLifts, approveLift, rejectLift, type PendingSubmission } from "../api/lifts";

export default function AdminPage() {
  const { user, token } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [pendingLifts, setPendingLifts] = useState<PendingSubmission[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([getPendingUsers(token), getPendingLifts(token)])
      .then(([users, lifts]) => { setPendingUsers(users); setPendingLifts(lifts); })
      .catch((err) => setError(err.message));
  }, [token]);

  if (!user || user.role !== "admin") {
    return <div className="page"><p className="muted">Access denied.</p></div>;
  }

  async function handleApproveUser(userId: number) {
    try { await approveUser(token!, userId); setPendingUsers((p) => p.filter((u) => u.id !== userId)); }
    catch (err) { setError(err instanceof Error ? err.message : "Something went wrong"); }
  }

  async function handleSuspendUser(userId: number) {
    try { await suspendUser(token!, userId); setPendingUsers((p) => p.filter((u) => u.id !== userId)); }
    catch (err) { setError(err instanceof Error ? err.message : "Something went wrong"); }
  }

  async function handleApproveLift(id: number) {
    try { await approveLift(token!, id); setPendingLifts((p) => p.filter((l) => l.id !== id)); }
    catch (err) { setError(err instanceof Error ? err.message : "Something went wrong"); }
  }

  async function handleRejectLift(id: number) {
    try { await rejectLift(token!, id); setPendingLifts((p) => p.filter((l) => l.id !== id)); }
    catch (err) { setError(err instanceof Error ? err.message : "Something went wrong"); }
  }

  return (
    <div className="page">
      <h1>Admin</h1>
      {error && <p className="error-msg" style={{ marginBottom: "var(--gap-md)" }}>{error}</p>}

      {/* ── Pending registrations ── */}
      <section style={{ marginBottom: "var(--gap-xl)" }}>
        <h2>Pending registrations</h2>
        {pendingUsers.length === 0 ? (
          <p className="muted">No pending registrations.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Gender</th>
                <th>Registered</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.gender}</td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td style={{ display: "flex", gap: "var(--gap-sm)" }}>
                    <button className="btn-ghost" style={{ padding: "4px 10px", fontSize: "var(--text-sm)" }} onClick={() => handleApproveUser(u.id)}>Approve</button>
                    <button className="btn-danger" onClick={() => handleSuspendUser(u.id)}>Suspend</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ── Pending lift submissions ── */}
      <section>
        <h2>Pending lifts</h2>
        {pendingLifts.length === 0 ? (
          <p className="muted">No pending lift submissions.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Lift</th>
                <th>Result</th>
                <th>Class</th>
                <th>Videos</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pendingLifts.map((l) => (
                <tr key={l.id}>
                  <td>{l.user_name}</td>
                  <td>{l.lift_type}</td>
                  <td>{l.weight_kg !== null ? `${l.weight_kg}kg` : `${l.reps} reps`}</td>
                  <td>{l.weight_class}</td>
                  <td style={{ display: "flex", gap: "var(--gap-sm)" }}>
                    <a href={l.scale_video_url} target="_blank" rel="noreferrer">Scale ↗</a>
                    <a href={l.lift_video_url} target="_blank" rel="noreferrer">Lift ↗</a>
                  </td>
                  <td style={{ display: "flex", gap: "var(--gap-sm)" }}>
                    <button className="btn-ghost" style={{ padding: "4px 10px", fontSize: "var(--text-sm)" }} onClick={() => handleApproveLift(l.id)}>Approve</button>
                    <button className="btn-danger" onClick={() => handleRejectLift(l.id)}>Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
