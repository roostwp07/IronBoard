import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getProfile, getAvatarPresignedUrl, saveAvatar, type ApprovedLift, type ProfileData } from "../api/profile";
import { uploadToS3 } from "../api/posts";
import Avatar from "../components/Avatar";

const LIFT_ORDER = ["squat", "bench", "deadlift", "ohp", "pullups", "chinups", "dips"];

export default function ProfilePage() {
  const { token, user, setSession } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) return;
    getProfile(token)
      .then(setProfile)
      .catch((err) => setError(err.message));
  }, [token]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !token || !user) return;
    setUploading(true);
    setError(null);
    try {
      const { uploadUrl, key } = await getAvatarPresignedUrl(token, file.type);
      await uploadToS3(uploadUrl, file);
      const avatarUrl = await saveAvatar(token, key);
      // Update context so the navbar avatar refreshes immediately.
      setSession(token, { ...user, avatar_url: avatarUrl });
      setProfile((prev) => prev ? { ...prev, user: { ...prev.user, avatar_url: avatarUrl } } : prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (error) return <div className="page"><p className="error-msg">{error}</p></div>;
  if (!profile) return <div className="page"><p className="muted">Loading…</p></div>;

  const { user: profileUser, lifts } = profile;

  const byType: Record<string, ApprovedLift[]> = {};
  for (const lift of lifts) {
    if (!byType[lift.lift_type]) byType[lift.lift_type] = [];
    byType[lift.lift_type].push(lift);
  }

  const prs = LIFT_ORDER
    .filter((lt) => byType[lt]?.length > 0)
    .map((lt) => ({ lift_type: lt, best: byType[lt][0] }));

  return (
    <div className="page">
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--gap-xl)", marginBottom: "var(--gap-xl)", paddingTop: "var(--gap-xl)" }}>
        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--gap-xs)" }}>
          <Avatar name={profileUser.name} avatarUrl={profileUser.avatar_url} size={96} />
          <span className="muted" style={{ fontSize: 11, cursor: "pointer" }}>
            {uploading ? "Uploading…" : "Upload photo"}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
            title="Upload photo"
          />
        </div>
        <div>
          <h1 style={{ fontSize: 28, marginBottom: "var(--gap-xs)" }}>{profileUser.name}</h1>
          <p className="muted" style={{ textTransform: "capitalize" }}>{profileUser.gender}</p>
        </div>
      </div>

      {/* ── PRs ── */}
      <section style={{ marginBottom: "var(--gap-xl)" }}>
        <h2>Personal records</h2>
        {prs.length === 0 ? (
          <p className="muted">No approved lifts yet.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "var(--gap-md)" }}>
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

      {/* ── Lift history ── */}
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
