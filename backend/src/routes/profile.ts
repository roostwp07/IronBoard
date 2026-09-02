import { Router } from "express";
import { query } from "../db.ts";
import { requireAuth } from "../middleware/auth.ts";

export const profileRouter = Router();

// GET /api/profile
// Returns the logged-in user's approved lift submissions,
// ordered by lift type then by best result descending.
profileRouter.get("/", requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT
         id, lift_type, weight_kg, reps, weight_class,
         scale_video_url, lift_video_url, created_at
       FROM lift_submissions
       WHERE user_id = $1 AND status = 'approved'
       ORDER BY lift_type, weight_kg DESC NULLS LAST, reps DESC NULLS LAST`,
      [req.user!.id]
    );
    return res.json({ user: req.user, lifts: result.rows });
  } catch (err) {
    console.error("Profile error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
