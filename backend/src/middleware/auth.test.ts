import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { app } from "../app.ts";
import { pool, query } from "../db.ts";

const stamp = Date.now();
const email = (label: string) => `test_mw_${label}_${stamp}@example.com`;

// Helper: register a user, approve them, log in, return the token.
async function makeActiveUserToken(label: string): Promise<string> {
  const e = email(label);
  await request(app).post("/api/auth/register").send({
    email: e, password: "benchpress1", name: "MW Tester", gender: "male",
  });
  await query("UPDATE users SET status='active' WHERE email=$1", [e]);
  const res = await request(app).post("/api/auth/login").send({
    email: e, password: "benchpress1",
  });
  return res.body.token;
}

afterAll(async () => {
  await query("DELETE FROM users WHERE email LIKE $1", [`test_mw_%_${stamp}@example.com`]);
  await pool.end();
});

describe("requireAuth middleware (via GET /api/auth/me)", () => {
  it("allows access with a valid token and returns the current user", async () => {
    const token = await makeActiveUserToken("valid");
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.status).toBe("active");
    expect(res.body.user).not.toHaveProperty("password");
  });

  it("rejects a request with no Authorization header (401)", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects a malformed/garbage token (401)", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer not.a.real.token");
    expect(res.status).toBe(401);
  });

  it("rejects a valid token whose user was suspended after login (403)", async () => {
    const e = email("suspended");
    await request(app).post("/api/auth/register").send({
      email: e, password: "benchpress1", name: "Suspended", gender: "male",
    });
    await query("UPDATE users SET status='active' WHERE email=$1", [e]);
    const login = await request(app).post("/api/auth/login").send({
      email: e, password: "benchpress1",
    });
    const token = login.body.token;

    // Token is valid, but the account gets suspended afterward.
    await query("UPDATE users SET status='suspended' WHERE email=$1", [e]);

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
