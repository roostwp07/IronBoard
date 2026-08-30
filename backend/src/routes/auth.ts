import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { query } from "../db.ts";
import { config } from "../config.ts";
import { requireAuth } from "../middleware/auth.ts";

export const authRouter = Router();

// Shape we require from the client. zod validates at runtime, so bad
// input is rejected before it ever touches the database.
const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8), // minimum length; hashing happens after
  name: z.string().min(1),
  gender: z.enum(["male", "female"]),
});

// How many rounds bcrypt uses. Higher = slower = harder to brute-force.
const SALT_ROUNDS = 10;

authRouter.post("/register", async (req, res) => {
  // 1. Validate input.
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
  }
  const { email, password, name, gender } = parsed.data;

  try {
    // 2. Hash the password (never store the raw value).
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // 3. Insert. status defaults to 'pending' and role to 'member'
    //    via the schema, so new users need admin approval.
    //    RETURNING gives us the new row back — minus the password.
    const result = await query(
      `INSERT INTO users (email, password, name, gender)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, gender, role, status, created_at`,
      [email, passwordHash, name, gender]
    );

    return res.status(201).json({ user: result.rows[0] });
  } catch (err: any) {
    // Postgres error 23505 = unique violation (email already taken).
    if (err?.code === "23505") {
      return res.status(409).json({ error: "Email already registered" });
    }
    console.error("Register error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ---- Login ----

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1), // any non-empty string; real check is bcrypt.compare
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }
  const { email, password } = parsed.data;

  try {
    // Look up the user by email (need the password hash + status).
    const result = await query(
      `SELECT id, email, password, name, gender, role, status
       FROM users WHERE email = $1`,
      [email]
    );
    const user = result.rows[0];

    // Same generic error whether the email is unknown OR the password
    // is wrong, so attackers can't probe which emails are registered.
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Only active users may log in. Pending/suspended are turned away.
    if (user.status !== "active") {
      return res.status(403).json({ error: `Account is ${user.status}` });
    }

    // Sign a JWT carrying just the user id. The signature proves
    // authenticity; we look up fresh data on protected requests.
    const token = jwt.sign({ userId: user.id }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });

    // Never send the password hash back.
    const { password: _pw, ...safeUser } = user;
    return res.json({ token, user: safeUser });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ---- Current user ----
// Protected by requireAuth: only reachable with a valid token for an
// active user. The frontend calls this to check if a stored token is
// still good and to load the logged-in user's info.
authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});
