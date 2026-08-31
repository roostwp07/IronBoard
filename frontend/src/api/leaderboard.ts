// One entry on the leaderboard — a user's best lift.
export interface LeaderboardEntry {
  user_id: number;
  name: string;
  weight_kg: string | null; // decimal comes back as string from Postgres
  reps: number | null;
}

// The nested structure returned by GET /api/leaderboard:
// { gender → weight_class → lift_type → entries[] }
export type Leaderboard = Record<
  string,
  Record<string, Record<string, LeaderboardEntry[]>>
>;

export async function getLeaderboard(): Promise<Leaderboard> {
  const res = await fetch("/api/leaderboard");
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to load leaderboard");
  return json.leaderboard;
}
