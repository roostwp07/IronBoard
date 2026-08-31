import { Router } from "express";
import { query } from "../db.ts";

export const leaderboardRouter = Router();

// GET /api/leaderboard
// Public — no auth required.
//
// Returns each user's single best approved lift per lift type,
// structured as: { gender → weight_class → lift_type → [entries] }
//
// "Best" means:
//   - weighted lifts (squat, bench, deadlift, ohp): highest weight_kg
//   - bodyweight lifts (pullups, chinups, dips): most reps
leaderboardRouter.get("/", async (_req, res) => {
  try {
    // DISTINCT ON (user_id, lift_type) keeps only the first row per
    // user+lift combination after the ORDER BY — which is their best.
    // We order by weight_kg DESC NULLS LAST, reps DESC NULLS LAST so
    // weighted lifts sort by weight and bodyweight lifts sort by reps.
    const result = await query(`
      SELECT DISTINCT ON (ls.user_id, ls.lift_type)
        u.id          AS user_id,
        u.name,
        u.gender,
        ls.lift_type,
        ls.weight_class,
        ls.weight_kg,
        ls.reps
      FROM lift_submissions ls
      JOIN users u ON u.id = ls.user_id
      WHERE ls.status = 'approved'
      ORDER BY
        ls.user_id,
        ls.lift_type,
        ls.weight_kg  DESC NULLS LAST,
        ls.reps       DESC NULLS LAST
    `);

    // Transform the flat rows into a nested structure the frontend
    // can render directly:
    // {
    //   male:   { "83kg": { squat: [...], bench: [...] } },
    //   female: { "63kg": { deadlift: [...] } }
    // }
    const leaderboard: Record<
      string,
      Record<string, Record<string, typeof rows>>
    > = {};

    const rows = result.rows;

    for (const row of rows) {
      const { gender, weight_class, lift_type, ...entry } = row;

      if (!leaderboard[gender]) leaderboard[gender] = {};
      if (!leaderboard[gender][weight_class]) leaderboard[gender][weight_class] = {};
      if (!leaderboard[gender][weight_class][lift_type]) {
        leaderboard[gender][weight_class][lift_type] = [];
      }

      leaderboard[gender][weight_class][lift_type].push(entry);
    }

    return res.json({ leaderboard });
  } catch (err) {
    console.error("Leaderboard error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
