import express from "express";
import { authRouter } from "./routes/auth.ts";

// Build the Express app but do NOT start listening here. Tests import
// this `app` and run requests against it in-memory (via supertest),
// while index.ts is what actually opens a port in real use.
export const app = express();

// Parse incoming JSON request bodies into req.body.
app.use(express.json());

// Health-check route to confirm the server is alive.
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Auth routes: /api/auth/register, /api/auth/login
app.use("/api/auth", authRouter);
