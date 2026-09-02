import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLeaderboard, type Leaderboard } from "../api/leaderboard";
import { useAuth } from "../context/AuthContext";

const LIFT_ORDER = ["squat", "bench", "deadlift", "ohp", "pullups", "chinups", "dips"];

const WEIGHT_CLASS_ORDER = [
  "47kg", "52kg", "57kg", "63kg", "69kg", "74kg", "83kg",
  "93kg", "105kg", "120kg", "120kg+",
];

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gender, setGender] = useState<"male" | "female">("male");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getLeaderboard()
      .then(setLeaderboard)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="page"><p className="error-msg">{error}</p></div>;
  if (!leaderboard) return <div className="page"><p className="muted">Loading…</p></div>;

  const genderData = leaderboard[gender] ?? {};

  const sortedWeightClasses = Object.keys(genderData).sort((a, b) => {
    const ai = WEIGHT_CLASS_ORDER.indexOf(a);
    const bi = WEIGHT_CLASS_ORDER.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  function handleSubmitLift() {
    if (user) {
      navigate("/log-lift");
    } else {
      navigate("/login");
    }
  }

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "var(--gap-lg)" }}>
        <h1 style={{ margin: 0 }}>Leaderboard</h1>
        <button className="btn-ghost" onClick={handleSubmitLift} style={{ fontSize: "var(--text-sm)", padding: "5px 12px" }}>
          Submit a lift!
        </button>
      </div>

      {/* Gender tabs */}
      <div style={{ display: "flex", gap: "var(--gap-sm)", marginBottom: "var(--gap-xl)" }}>
        {(["male", "female"] as const).map((g) => (
          <button
            key={g}
            className={gender === g ? "btn-primary" : "btn-ghost"}
            onClick={() => setGender(g)}
            style={{ padding: "5px 14px" }}
          >
            {g.charAt(0).toUpperCase() + g.slice(1)}
          </button>
        ))}
      </div>

      {sortedWeightClasses.length === 0 && (
        <p className="muted">No approved lifts yet for this category.</p>
      )}

      {sortedWeightClasses.map((weightClass) => (
        <section key={weightClass} style={{ marginBottom: "var(--gap-xl)" }}>
          <h2>{weightClass}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "var(--gap-md)" }}>
            {LIFT_ORDER.filter((lift) => genderData[weightClass]?.[lift]).map((lift) => {
              const entries = genderData[weightClass][lift];
              return (
                <div key={lift} style={{
                  background: "var(--bg-2)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: "var(--gap-md)",
                }}>
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--text)", marginBottom: "var(--gap-sm)", textTransform: "capitalize" }}>
                    {lift}
                  </p>
                  <ol style={{ paddingLeft: "var(--gap-md)", margin: 0 }}>
                    {entries.map((entry, i) => (
                      <li key={entry.user_id} style={{
                        fontSize: i === 0 ? "var(--text-base)" : "var(--text-sm)",
                        color: i === 0 ? "var(--text-strong)" : "var(--text)",
                        marginBottom: "var(--gap-xs)",
                      }}>
                        {entry.name}
                        <span style={{ color: "var(--accent-dim)", marginLeft: "var(--gap-xs)" }}>
                          {entry.weight_kg !== null ? `${entry.weight_kg}kg` : `${entry.reps} reps`}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
