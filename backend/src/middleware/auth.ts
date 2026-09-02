import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { query } from "../db.ts";
import { config } from "../config.ts";

// The authenticated user we attach to the request. Only the fields
// handlers actually need — never the password hash.
export interface AuthUser {
  id: number;
  email: string;
  name: string;
  gender: string;
  role: "member" | "admin";
  status: string;
  avatar_url: string | null;
}

// Tell TypeScript that req.user may exist once this middleware runs.
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Shape of what we signed into the token (see auth.ts login handler).
interface JwtPayload {
  userId: number;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  // 1. Pull the token out of "Authorization: Bearer <token>".
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed Authorization header" });
  }
  const token = header.slice("Bearer ".length);

  // 2. Verify the signature + expiry. Throws if invalid/expired.
  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  // 3. Look up fresh user data — a token can outlive an account change
  //    (e.g. the user was suspended after the token was issued).
  const result = await query(
    `SELECT id, email, name, gender, role, status, avatar_url FROM users WHERE id = $1`,
    [payload.userId]
  );
  const user = result.rows[0];
  if (!user) {
    return res.status(401).json({ error: "User no longer exists" });
  }

  // 4. Enforce the "must be active" rule on every protected request.
  if (user.status !== "active") {
    return res.status(403).json({ error: `Account is ${user.status}` });
  }

  // 5. Attach the user and hand off to the actual route handler.
  req.user = user;
  next();
}

// Guard for admin-only routes. Use *after* requireAuth in the chain.
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}
