/**
 * users.test.ts
 * Integration tests for the /users endpoints.
 *
 * Run:  npx jest src/modules/users/users.test.ts --runInBand
 *
 * Requires a running Postgres instance pointed to by DATABASE_URL.
 * Each describe block creates its own users so tests are order-independent.
 */



import request from "supertest";
import { createApp } from "@/app";
import { pool } from "@/config/db";
import { hashPassword } from "@/utils/hash.utils";
import { signAccessToken } from "@/utils/jwt.utils";

const app = createApp();
console.log("APP:", app);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Insert a user directly into the DB and return a signed access token for them. */
async function createUserAndToken(overrides: {
  email: string;
  role?: "customer" | "admin" | "super_admin";
  isActive?: boolean;
}): Promise<{ userId: string; token: string }> {
  const passwordHash = await hashPassword("Test@1234");
  const { rows } = await pool.query(
    `INSERT INTO users
       (email, password_hash, first_name, last_name, role, is_active, email_verified)
     VALUES ($1, $2, 'Test', 'User', $3, $4, true)
     RETURNING id`,
    [
      overrides.email,
      passwordHash,
      overrides.role ?? "customer",
      overrides.isActive ?? true,
    ],
  );

  const userId = (rows[0] as { id: string }).id;
  const token = signAccessToken({
    userId,
    email: overrides.email,
    role: overrides.role ?? "customer",
  });

  return { userId, token };
}

/** Remove test users by email prefix to keep the DB clean. */
async function cleanupUsers(emailLike: string) {
  await pool.query("DELETE FROM users WHERE email LIKE $1", [
    `${emailLike}%`,
  ]);
}

// ─── Test suites ──────────────────────────────────────────────────────────────

describe("GET /api/v1/users", () => {
  const PREFIX = "listtest_";

  beforeAll(async () => {
    await cleanupUsers(PREFIX);
    await createUserAndToken({ email: `${PREFIX}customer@test.com`, role: "customer" });
    await createUserAndToken({ email: `${PREFIX}admin@test.com`,    role: "admin"    });
  });

afterAll(async () => {
  await cleanupUsers(PREFIX);
});
  it("returns 401 when unauthenticated", async () => {
    const res = await request(app).get("/api/v1/users");
    expect(res.status).toBe(401);
  });

  it("returns 403 for a customer token", async () => {
    const { token } = await createUserAndToken({
      email: `${PREFIX}forbidden@test.com`,
      role: "customer",
    });
    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
    await cleanupUsers(`${PREFIX}forbidden`);
  });

  it("returns paginated user list for admin", async () => {
    const { token } = await createUserAndToken({
      email: `${PREFIX}adminviewer@test.com`,
      role: "admin",
    });
    const res = await request(app)
      .get("/api/v1/users?page=1&limit=10")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toMatchObject({
      page: 1,
      limit: 10,
    });
    await cleanupUsers(`${PREFIX}adminviewer`);
  });

  it("filters by role=customer", async () => {
    const { token } = await createUserAndToken({
      email: `${PREFIX}rolefilter@test.com`,
      role: "admin",
    });
    const res = await request(app)
      .get("/api/v1/users?role=customer")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    const roles = (res.body.data as { role: string }[]).map((u) => u.role);
    expect(roles.every((r) => r === "customer")).toBe(true);
    await cleanupUsers(`${PREFIX}rolefilter`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("POST /api/v1/users  (create admin)", () => {
  const PREFIX = "createadmin_";

  afterAll(() => cleanupUsers(PREFIX));

  it("returns 403 for non-super_admin", async () => {
    const { token } = await createUserAndToken({
      email: `${PREFIX}admin@test.com`,
      role: "admin",
    });
    const res = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${token}`)
      .send({ email: `${PREFIX}new@test.com`, firstName: "A", lastName: "B", role: "admin" });
    expect(res.status).toBe(403);
    await cleanupUsers(`${PREFIX}admin`);
  });

  it("creates an admin account as super_admin", async () => {
    const { token } = await createUserAndToken({
      email: `${PREFIX}superadmin@test.com`,
      role: "super_admin",
    });
    const res = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${token}`)
      .send({
        email:     `${PREFIX}newadmin@test.com`,
        firstName: "New",
        lastName:  "Admin",
        role:      "admin",
      });
    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe("admin");
    expect(res.body.data.isActive).toBe(true);
    // password should NOT be in the response
    expect(res.body.data.passwordHash).toBeUndefined();
  });

  it("rejects duplicate email", async () => {
    const { token } = await createUserAndToken({
      email: `${PREFIX}sa2@test.com`,
      role: "super_admin",
    });
    // First create
    await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${token}`)
      .send({
        email:     `${PREFIX}dup@test.com`,
        firstName: "Dup",
        lastName:  "User",
        role:      "customer",
      });
    // Second create — same email
    const res = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${token}`)
      .send({
        email:     `${PREFIX}dup@test.com`,
        firstName: "Dup",
        lastName:  "User",
        role:      "customer",
      });
    expect(res.status).toBe(409);
    await cleanupUsers(`${PREFIX}sa2`);
  });

  it("rejects super_admin role assignment via API", async () => {
    const { token } = await createUserAndToken({
      email: `${PREFIX}sa3@test.com`,
      role: "super_admin",
    });
    const res = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${token}`)
      .send({
        email:     `${PREFIX}illegal@test.com`,
        firstName: "X",
        lastName:  "Y",
        role:      "super_admin", // should be blocked
      });
    expect(res.status).toBe(400); // schema validation
    await cleanupUsers(`${PREFIX}sa3`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("PATCH /api/v1/users/:id/role", () => {
  const PREFIX = "changerole_";

  afterAll(() => cleanupUsers(PREFIX));

  it("promotes customer to admin", async () => {
    const { token } = await createUserAndToken({
      email: `${PREFIX}sa@test.com`,
      role: "super_admin",
    });
    const { userId: targetId } = await createUserAndToken({
      email: `${PREFIX}target@test.com`,
      role: "customer",
    });

    const res = await request(app)
      .patch(`/api/v1/users/${targetId}/role`)
      .set("Authorization", `Bearer ${token}`)
      .send({ role: "admin" });

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe("admin");
  });

  it("blocks self role change", async () => {
    const { userId, token } = await createUserAndToken({
      email: `${PREFIX}selfchange@test.com`,
      role: "super_admin",
    });
    const res = await request(app)
      .patch(`/api/v1/users/${userId}/role`)
      .set("Authorization", `Bearer ${token}`)
      .send({ role: "admin" });
    expect(res.status).toBe(400);
  });

  it("blocks non-super_admin from changing roles", async () => {
    const { token } = await createUserAndToken({
      email: `${PREFIX}adminonly@test.com`,
      role: "admin",
    });
    const { userId: targetId } = await createUserAndToken({
      email: `${PREFIX}victim@test.com`,
      role: "customer",
    });
    const res = await request(app)
      .patch(`/api/v1/users/${targetId}/role`)
      .set("Authorization", `Bearer ${token}`)
      .send({ role: "admin" });
    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("PATCH /api/v1/users/:id/toggle", () => {
  const PREFIX = "toggle_";

  afterAll(() => cleanupUsers(PREFIX));

  it("admin can disable a customer", async () => {
    const { token } = await createUserAndToken({
      email: `${PREFIX}admin@test.com`,
      role: "admin",
    });
    const { userId } = await createUserAndToken({
      email: `${PREFIX}customer@test.com`,
      role: "customer",
    });
    const res = await request(app)
      .patch(`/api/v1/users/${userId}/toggle`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(false);
  });

  it("admin cannot disable another admin", async () => {
    const { token } = await createUserAndToken({
      email: `${PREFIX}admin2@test.com`,
      role: "admin",
    });
    const { userId } = await createUserAndToken({
      email: `${PREFIX}admin3@test.com`,
      role: "admin",
    });
    const res = await request(app)
      .patch(`/api/v1/users/${userId}/toggle`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("super_admin can disable an admin", async () => {
    const { token } = await createUserAndToken({
      email: `${PREFIX}sa@test.com`,
      role: "super_admin",
    });
    const { userId } = await createUserAndToken({
      email: `${PREFIX}admin4@test.com`,
      role: "admin",
    });
    const res = await request(app)
      .patch(`/api/v1/users/${userId}/toggle`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it("blocks self-disable", async () => {
    const { userId, token } = await createUserAndToken({
      email: `${PREFIX}self@test.com`,
      role: "admin",
    });
    const res = await request(app)
      .patch(`/api/v1/users/${userId}/toggle`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("DELETE /api/v1/users/:id", () => {
  const PREFIX = "delete_";

  afterAll(() => cleanupUsers(PREFIX));

  it("admin can delete a customer", async () => {
    const { token } = await createUserAndToken({
      email: `${PREFIX}admin@test.com`,
      role: "admin",
    });
    const { userId } = await createUserAndToken({
      email: `${PREFIX}customer@test.com`,
      role: "customer",
    });
    const res = await request(app)
      .delete(`/api/v1/users/${userId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it("admin cannot delete another admin", async () => {
    const { token } = await createUserAndToken({
      email: `${PREFIX}admin2@test.com`,
      role: "admin",
    });
    const { userId } = await createUserAndToken({
      email: `${PREFIX}admin3@test.com`,
      role: "admin",
    });
    const res = await request(app)
      .delete(`/api/v1/users/${userId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("blocks self-delete", async () => {
    const { userId, token } = await createUserAndToken({
      email: `${PREFIX}self@test.com`,
      role: "super_admin",
    });
    const res = await request(app)
      .delete(`/api/v1/users/${userId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it("returns 404 for non-existent user", async () => {
    const { token } = await createUserAndToken({
      email: `${PREFIX}sa@test.com`,
      role: "super_admin",
    });
    const res = await request(app)
      .delete("/api/v1/users/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("GET /api/v1/users/audit-logs", () => {
  const PREFIX = "auditlogs_";

  afterAll(() => cleanupUsers(PREFIX));

  it("returns 403 for non-super_admin", async () => {
    const { token } = await createUserAndToken({
      email: `${PREFIX}admin@test.com`,
      role: "admin",
    });
    const res = await request(app)
      .get("/api/v1/users/audit-logs")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("returns paginated audit logs for super_admin", async () => {
    const { token } = await createUserAndToken({
      email: `${PREFIX}sa@test.com`,
      role: "super_admin",
    });
    const res = await request(app)
      .get("/api/v1/users/audit-logs?page=1&limit=5")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 5 });
  });

  it("filters audit logs by action", async () => {
    const { token } = await createUserAndToken({
      email: `${PREFIX}sa2@test.com`,
      role: "super_admin",
    });
    const res = await request(app)
      .get("/api/v1/users/audit-logs?action=ADMIN_CREATED")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    const actions = (res.body.data as { action: string }[]).map(
      (l) => l.action,
    );
    expect(actions.every((a) => a === "ADMIN_CREATED")).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Migration 008 — audit_logs table", () => {
  it("audit_logs table exists with expected columns", async () => {
    const { rows } = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'audit_logs'
      ORDER BY ordinal_position
    `);
    const cols = (rows as { column_name: string }[]).map((r) => r.column_name);
    expect(cols).toEqual(
      expect.arrayContaining([
        "id",
        "actor_user_id",
        "action",
        "target_user_id",
        "metadata",
        "created_at",
      ]),
    );
  });

  it("users table has last_login_at column", async () => {
    const { rows } = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'last_login_at'
    `);
    expect(rows.length).toBe(1);
  });
});