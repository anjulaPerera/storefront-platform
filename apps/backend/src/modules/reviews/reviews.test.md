import "dotenv/config";
import request from "supertest";
import { createApp } from "@/app";
import { pool } from "@/config/db";
import { runMigrations } from "@/db/migrationRunner";

const app = createApp();
const ts = Date.now();

let adminToken: string;
let categoryId: string;
let productSlug: string;
let productId: string;

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  const client = await pool.connect();
  try {
    await runMigrations(client);
  } finally {
    client.release();
  }

  // Create or fetch admin
  const adminEmail = `admin_prod_${ts}@example.com`;
  await request(app).post("/api/v1/auth/register").send({
    email: adminEmail,
    password: "AdminPass123",
    firstName: "Admin",
    lastName: "Test",
  });
  await pool.query(`UPDATE users SET role = 'admin' WHERE email = $1`, [
    adminEmail,
  ]);

  const loginRes = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: adminEmail, password: "AdminPass123" });
  adminToken = loginRes.body.data.accessToken as string;

  // Create test category
  const catRes = await request(app)
    .post("/api/v1/categories")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ name: `Test Category ${ts}` });
  categoryId = catRes.body.data.id as string;
});

afterAll(async () => {
  if (productId)
    await pool.query("DELETE FROM products   WHERE id = $1", [productId]);
  if (categoryId)
    await pool.query("DELETE FROM categories WHERE id = $1", [categoryId]);
  await pool.query(`DELETE FROM users WHERE email LIKE $1`, [
    `%_prod_${ts}@example.com`,
  ]);
  await pool.end();
});

// ─── Create ───────────────────────────────────────────────────────────────────

describe("POST /api/v1/products", () => {
  it("admin can create a product", async () => {
    const res = await request(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        categoryId,
        name: `Test Phone ${ts}`,
        price: 99900,
        brand: "TestBrand",
        stockQuantity: 10,
        attributes: { ram: "8", storage: "128", os: "Android" },
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toContain("Test Phone");

    productSlug = res.body.data.slug as string;
    productId = res.body.data.id as string;
  });

  it("rejects unauthenticated create", async () => {
    const res = await request(app)
      .post("/api/v1/products")
      .send({ categoryId, name: "Hack", price: 1 });
    expect(res.status).toBe(401);
  });
});

// ─── List ─────────────────────────────────────────────────────────────────────

describe("GET /api/v1/products", () => {
  it("returns paginated products", async () => {
    const res = await request(app).get("/api/v1/products?page=1&limit=5");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty("total");
    expect(res.body.meta).toHaveProperty("totalPages");
  });

  it("filters by brand", async () => {
    const res = await request(app).get("/api/v1/products?brand=TestBrand");
    expect(res.status).toBe(200);
    expect(
      res.body.data.every((p: { brand: string }) => p.brand === "TestBrand"),
    ).toBe(true);
  });

  it("filters by price range", async () => {
    const res = await request(app).get(
      "/api/v1/products?minPrice=50000&maxPrice=150000",
    );
    expect(res.status).toBe(200);
    expect(
      res.body.data.every(
        (p: { price: number }) => p.price >= 50000 && p.price <= 150000,
      ),
    ).toBe(true);
  });
});

// ─── Get by slug ──────────────────────────────────────────────────────────────

describe("GET /api/v1/products/:slug", () => {
  it("returns product detail with joins", async () => {
    const res = await request(app).get(`/api/v1/products/${productSlug}`);
    expect(res.status).toBe(200);
    expect(res.body.data.slug).toBe(productSlug);
    expect(res.body.data.categoryName).toBeDefined();
    expect(res.body.data.averageRating).toBeDefined();
  });

  it("returns 404 for unknown slug", async () => {
    const res = await request(app).get("/api/v1/products/does-not-exist-slug");
    expect(res.status).toBe(404);
  });
});

// ─── Search ───────────────────────────────────────────────────────────────────

describe("GET /api/v1/products/search", () => {
  it("returns search results", async () => {
    const res = await request(app).get("/api/v1/products/search?q=TestBrand");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("returns empty array for blank query", async () => {
    const res = await request(app).get("/api/v1/products/search?q=");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

// ─── Update & Stock ───────────────────────────────────────────────────────────

describe("Product admin operations", () => {
  it("admin can update a product", async () => {
    const res = await request(app)
      .put(`/api/v1/products/${productId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ price: 109900 });

    expect(res.status).toBe(200);
    expect(res.body.data.price).toBe(109900);
  });

  it("admin can update stock", async () => {
    const res = await request(app)
      .patch(`/api/v1/products/${productId}/stock`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ stockQuantity: 25 });

    expect(res.status).toBe(200);
  });

  it("admin can toggle product visibility", async () => {
    const res = await request(app)
      .patch(`/api/v1/products/${productId}/toggle`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("isActive");
  });
});

// ─── Categories ───────────────────────────────────────────────────────────────

describe("GET /api/v1/categories", () => {
  it("returns category tree", async () => {
    const res = await request(app).get("/api/v1/categories");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

// ─── Banners ──────────────────────────────────────────────────────────────────

describe("Banners", () => {
  let bannerId: string;

  it("admin can create a banner", async () => {
    const res = await request(app)
      .post("/api/v1/banners")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        type: "top_strip",
        content: `Test banner ${ts}`,
        isActive: true,
      });
    expect(res.status).toBe(201);
    bannerId = res.body.data.id as string;
  });

  it("public can fetch active banners", async () => {
    const res = await request(app).get("/api/v1/banners");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  afterAll(async () => {
    if (bannerId)
      await pool.query("DELETE FROM banners WHERE id = $1", [bannerId]);
  });
});
