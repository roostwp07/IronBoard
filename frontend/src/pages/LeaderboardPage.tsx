import { useEffect, useState } from "react";
import { getLeaderboard, type Leaderboard } from "../api/leaderboard";

// Lift types in the order we want to display them.
const LIFT_ORDER = ["squat", "bench", "deadlift", "ohp", "pullups", "chinups", "dips"];

// Weight classes in ascending order for consistent display.
const WEIGHT_CLASS_ORDER = [
  "47kg", "52kg", "57kg", "63kg", "69kg", "74kg", "83kg",
  "93kg", "105kg", "120kg", "120kg+",
];

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Which gender tab is active.
  const [gender, setGender] = useState<"male" | "female">("male");

  useEffect(() => {
    getLeaderboard()
      .then(setLeaderboard)
      .catch((err) => setError(err.message));
  }, []); // run once on mount

  if (error) {
    return <main style={{ padding: 32 }}><p style={{ color: "red" }}>{error}</p></main>;
  }

  if (!leaderboard) {
    return <main style={{ padding: 32 }}><p>Loading…</p></main>;
  }

  const genderData = leaderboard[gender] ?? {};

  // Sort weight classes by our defined order, put unknowns at the end.
  const sortedWeightClasses = Object.keys(genderData).sort(
    (a, b) => {
      const ai = WEIGHT_CLASS_ORDER.indexOf(a);
      const bi = WEIGHT_CLASS_ORDER.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    }
  );

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: 32 }}>
      <h1>Leaderboard</h1>

      {/* Gender tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {(["male", "female"] as const).map((g) => (
          <button
            key={g}
            onClick={() => setGender(g)}
            style={{ fontWeight: gender === g ? "bold" : "normal" }}
          >
            {g.charAt(0).toUpperCase() + g.slice(1)}
          </button>
        ))}
      </div>

      {sortedWeightClasses.length === 0 && (
        <p>No approved lifts yet for this category.</p>
      )}

      {sortedWeightClasses.map((weightClass) => (
        <section key={weightClass} style={{ marginBottom: 32 }}>
          <h2>{weightClass}</h2>

          {/* Only show lift types that have entries */}
          {LIFT_ORDER.filter((lift) => genderData[weightClass]?.[lift]).map((lift) => {
            const entries = genderData[weightClass][lift];
            return (
              <div key={lift} style={{ marginBottom: 16 }}>
                <h3 style={{ textTransform: "capitalize", marginBottom: 4 }}>{lift}</h3>
                <ol style={{ margin: 0, paddingLeft: 20 }}>
                  {entries.map((entry) => (
                    <li key={entry.user_id}>
                      {entry.name}
                      {" — "}
                      {entry.weight_kg !== null
                        ? `${entry.weight_kg}kg`
                        : `${entry.reps} reps`}
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
        </section>
      ))}
    </main>
  );
}
