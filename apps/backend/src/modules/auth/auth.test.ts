import "dotenv/config";
import request from "supertest";
import { createApp } from "@/app";
import { pool } from "@/config/db";
import { runMigrations } from "@/db/migrationRunner";

const app = createApp();
const ts = Date.now();
const TEST_EMAIL = `testuser_${ts}@example.com`;
const TEST_PASSWORD = "TestPass123";

let createdUserId: string;
let accessToken: string;
let refreshCookie: string;

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  const client = await pool.connect();
  try {
    await runMigrations(client);
  } finally {
    client.release();
  }
});

afterAll(async () => {
  if (createdUserId) {
    await pool.query("DELETE FROM users WHERE id = $1", [createdUserId]);
  }
  await pool.end();
});

// ─── Register ─────────────────────────────────────────────────────────────────

describe("POST /api/v1/auth/register", () => {
  it("creates a new customer account", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      firstName: "Test",
      lastName: "User",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(TEST_EMAIL);
    expect(res.body.data.user.role).toBe("customer");
    expect(res.body.data.user.password_hash).toBeUndefined();

    createdUserId = res.body.data.user.id as string;
  });

  it("rejects duplicate email", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      firstName: "A",
      lastName: "B",
    });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EMAIL_TAKEN");
  });

  it("rejects password without uppercase", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: `other_${ts}@example.com`,
        password: "nouppercase1",
        firstName: "A",
        lastName: "B",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects invalid email format", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      email: "not-an-email",
      password: TEST_PASSWORD,
      firstName: "A",
      lastName: "B",
    });

    expect(res.status).toBe(400);
  });
});

// ─── Login ────────────────────────────────────────────────────────────────────

describe("POST /api/v1/auth/login", () => {
  it("returns access token and sets refresh cookie", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.headers["set-cookie"]).toBeDefined();

    accessToken = res.body.data.accessToken as string;
    refreshCookie = (res.headers["set-cookie"] as unknown as string[])[0];
  });

  it("rejects wrong password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: TEST_EMAIL, password: "WrongPass999" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("rejects non-existent email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "nobody@example.com", password: TEST_PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });
});

// ─── /me ──────────────────────────────────────────────────────────────────────

describe("GET /api/v1/auth/me", () => {
  it("returns current user with valid token", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(TEST_EMAIL);
  });

  it("rejects missing token", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects malformed token", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer not.a.valid.jwt");
    expect(res.status).toBe(401);
  });
});

// ─── Refresh ──────────────────────────────────────────────────────────────────

describe("POST /api/v1/auth/refresh", () => {
  it("issues new access token using refresh cookie", async () => {
    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", refreshCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it("rejects request with no cookie", async () => {
    const res = await request(app).post("/api/v1/auth/refresh");
    expect(res.status).toBe(401);
  });
});

// ─── Logout ───────────────────────────────────────────────────────────────────

describe("POST /api/v1/auth/logout", () => {
  it("logs out and invalidates the refresh token", async () => {
    // Fresh login to get tokens
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    const { accessToken: token } = loginRes.body.data as {
      accessToken: string;
    };
    const cookie = (loginRes.headers["set-cookie"] as unknown as string[])[0];

    // Logout
    const logoutRes = await request(app)
      .post("/api/v1/auth/logout")
      .set("Authorization", `Bearer ${token}`)
      .set("Cookie", cookie);

    expect(logoutRes.status).toBe(200);

    // Old refresh token must now be rejected
    const refreshRes = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", cookie);

    expect(refreshRes.status).toBe(401);
  });
});

// ─── Forgot / Reset password ──────────────────────────────────────────────────

describe("POST /api/v1/auth/forgot-password", () => {
  it("always returns 200 regardless of email existence", async () => {
    const res1 = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: TEST_EMAIL });
    expect(res1.status).toBe(200);

    const res2 = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: "doesnotexist@example.com" });
    expect(res2.status).toBe(200);
  });
});
