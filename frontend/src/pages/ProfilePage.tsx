import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getProfile, type ApprovedLift, type ProfileData } from "../api/profile";

const LIFT_ORDER = ["squat", "bench", "deadlift", "ohp", "pullups", "chinups", "dips"];

export default function ProfilePage() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getProfile(token)
      .then(setProfile)
      .catch((err) => setError(err.message));
  }, [token]);

  if (error) return <div className="page"><p className="error-msg">{error}</p></div>;
  if (!profile) return <div className="page"><p className="muted">Loading…</p></div>;

  const { user, lifts } = profile;

  // Group lifts by lift_type.
  const byType: Record<string, ApprovedLift[]> = {};
  for (const lift of lifts) {
    if (!byType[lift.lift_type]) byType[lift.lift_type] = [];
    byType[lift.lift_type].push(lift);
  }

  // PR = first entry per lift type (already sorted best-first by backend).
  const prs = LIFT_ORDER
    .filter((lt) => byType[lt]?.length > 0)
    .map((lt) => ({ lift_type: lt, best: byType[lt][0] }));

  return (
    <div className="page">
      {/* ── Header ── */}
      <div style={{ marginBottom: "var(--gap-xl)" }}>
        <h1 style={{ marginBottom: "var(--gap-xs)" }}>{user.name}</h1>
        <p className="muted" style={{ textTransform: "capitalize" }}>{user.gender}</p>
      </div>

      {/* ── PRs ── */}
      <section style={{ marginBottom: "var(--gap-xl)" }}>
        <h2>Personal records</h2>
        {prs.length === 0 ? (
          <p className="muted">No approved lifts yet.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "var(--gap-sm)" }}>
            {prs.map(({ lift_type, best }) => (
              <div key={lift_type} style={{
                background: "var(--bg-2)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "var(--gap-md)",
              }}>
                <p className="muted" style={{ textTransform: "capitalize", marginBottom: "var(--gap-xs)" }}>{lift_type}</p>
                <p style={{ fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--accent)" }}>
                  {best.weight_kg !== null ? `${best.weight_kg}kg` : `${best.reps} reps`}
                </p>
                <p className="muted">{best.weight_class}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Full lift history ── */}
      <section>
        <h2>Lift history</h2>
        {lifts.length === 0 ? (
          <p className="muted">No approved lifts yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Lift</th>
                <th>Result</th>
                <th>Weight class</th>
                <th>Date</th>
                <th>Videos</th>
              </tr>
            </thead>
            <tbody>
              {lifts.map((lift) => (
                <tr key={lift.id}>
                  <td style={{ textTransform: "capitalize" }}>{lift.lift_type}</td>
                  <td>{lift.weight_kg !== null ? `${lift.weight_kg}kg` : `${lift.reps} reps`}</td>
                  <td>{lift.weight_class}</td>
                  <td>{new Date(lift.created_at).toLocaleDateString()}</td>
                  <td style={{ display: "flex", gap: "var(--gap-sm)" }}>
                    <a href={lift.scale_video_url} target="_blank" rel="noreferrer">Scale ↗</a>
                    <a href={lift.lift_video_url} target="_blank" rel="noreferrer">Lift ↗</a>
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
