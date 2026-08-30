import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { app } from "../app.ts";
import { pool, query } from "../db.ts";

// Unique email per test run so repeated runs don't collide on the
// UNIQUE(email) constraint. We delete these rows in afterAll.
const stamp = Date.now();
const email = (label: string) => `test_${label}_${stamp}@example.com`;

afterAll(async () => {
  // Clean up any users this test file created, then close the pool
  // so the process can exit.
  await query("DELETE FROM users WHERE email LIKE $1", [`test_%_${stamp}@example.com`]);
  await pool.end();
});

describe("POST /api/auth/register", () => {
  it("creates a new user with status 'pending' and returns no password", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: email("reg"),
      password: "squats123",
      name: "Reg Tester",
      gender: "male",
    });

    expect(res.status).toBe(201);
    expect(res.body.user.status).toBe("pending");
    expect(res.body.user.role).toBe("member");
    expect(res.body.user).not.toHaveProperty("password");
  });

  it("rejects a duplicate email with 409", async () => {
    const dupe = email("dupe");
    const payload = { email: dupe, password: "squats123", name: "Dupe", gender: "male" };
    await request(app).post("/api/auth/register").send(payload);

    const res = await request(app).post("/api/auth/register").send(payload);
    expect(res.status).toBe(409);
  });

  it("rejects invalid input (short password, bad gender) with 400", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: email("bad"),
      password: "short",
      name: "X",
      gender: "other",
    });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("rejects login for a pending (unapproved) user with 403", async () => {
    const e = email("pending");
    await request(app).post("/api/auth/register").send({
      email: e, password: "deadlift200", name: "Pending", gender: "female",
    });

    const res = await request(app).post("/api/auth/login").send({
      email: e, password: "deadlift200",
    });
    expect(res.status).toBe(403);
  });

  it("returns a JWT token for an active user with correct password", async () => {
    const e = email("active");
    await request(app).post("/api/auth/register").send({
      email: e, password: "deadlift200", name: "Active", gender: "female",
    });
    // Approve the user directly in the DB (admin approval simulated).
    await query("UPDATE users SET status='active' WHERE email=$1", [e]);

    const res = await request(app).post("/api/auth/login").send({
      email: e, password: "deadlift200",
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTypeOf("string");
    // A JWT has three dot-separated segments.
    expect(res.body.token.split(".")).toHaveLength(3);
    expect(res.body.user).not.toHaveProperty("password");
  });

  it("rejects a wrong password with 401", async () => {
    const e = email("wrongpw");
    await request(app).post("/api/auth/register").send({
      email: e, password: "deadlift200", name: "WrongPw", gender: "female",
    });
    await query("UPDATE users SET status='active' WHERE email=$1", [e]);

    const res = await request(app).post("/api/auth/login").send({
      email: e, password: "notmypassword",
    });
    expect(res.status).toBe(401);
  });

  it("rejects an unknown email with 401 (same message as wrong password)", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: email("nobody"), password: "whatever1",
    });
    expect(res.status).toBe(401);
  });
});
