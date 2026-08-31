import { Router } from "express";
import { query } from "../db.ts";
import { requireAuth, requireAdmin } from "../middleware/auth.ts";

export const adminRouter = Router();

// All admin routes require a valid JWT for an active user AND admin role.
// Applying both middleware here means every route below is automatically
// protected — we don't have to repeat it on each one.
adminRouter.use(requireAuth, requireAdmin);

// GET /api/admin/users/pending
// Returns all users who haven't been approved or suspended yet.
adminRouter.get("/users/pending", async (_req, res) => {
  try {
    const result = await query(
      `SELECT id, email, name, gender, created_at
       FROM users
       WHERE status = 'pending'
       ORDER BY created_at ASC`
    );
    return res.json({ users: result.rows });
  } catch (err) {
    console.error("Get pending users error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/users/:id/approve
// Flips the user's status to 'active' so they can log in.
adminRouter.post("/users/:id/approve", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(
      `UPDATE users SET status = 'active' WHERE id = $1
       RETURNING id, email, name, status`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({ user: result.rows[0] });
  } catch (err) {
    console.error("Approve user error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/users/:id/suspend
// Flips the user's status to 'suspended' — they can no longer log in
// and any existing JWT will be rejected by requireAuth.
adminRouter.post("/users/:id/suspend", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(
      `UPDATE users SET status = 'suspended' WHERE id = $1
       RETURNING id, email, name, status`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({ user: result.rows[0] });
  } catch (err) {
    console.error("Suspend user error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
