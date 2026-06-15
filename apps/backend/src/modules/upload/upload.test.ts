import "dotenv/config";
import request from "supertest";
import { v2 as cloudinary } from "cloudinary";
import { createApp } from "@/app";
import { pool } from "@/config/db";
import { runMigrations } from "@/db/migrationRunner";

// ─── Mock Cloudinary ──────────────────────────────────────────────────────────
//
// jest.mock() is hoisted above all imports by Jest's transform, so
// upload.service.ts receives this fake module before it ever runs.

jest.mock("cloudinary", () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(
        (
          _options: unknown,
          callback: (
            err: Error | null,
            result?: { secure_url: string },
          ) => void,
        ) => ({
          // Our service calls stream.end(buffer). The fake end() immediately
          // fires the callback with a deterministic URL — no network request.
          end: jest.fn(() =>
            callback(null, {
              secure_url:
                "https://res.cloudinary.com/demo/image/upload/v1/products/test.jpg",
            }),
          ),
        }),
      ),
    },
  },
}));

// ─── Minimal valid PNG (1×1 transparent pixel) ────────────────────────────────
//
// Using a real PNG header so multer's fileFilter accepts it as image/*.
// The base64 string below is a well-known minimal PNG used in test suites.

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

// ─── Shared state ─────────────────────────────────────────────────────────────

const app = createApp();
const ts = Date.now();

const ADMIN_EMAIL = `upload_admin_${ts}@example.com`;
const CUSTOMER_EMAIL = `upload_customer_${ts}@example.com`;
const PASSWORD = "UploadPass123";

let adminToken: string;
let customerToken: string;
let adminUserId: string;
let customerUserId: string;

// ─── Default mock implementation (restored after each test) ──────────────────

function applyDefaultMock() {
  (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
    (
      _options: unknown,
      callback: (err: Error | null, result?: { secure_url: string }) => void,
    ) => ({
      end: jest.fn(() =>
        callback(null, {
          secure_url:
            "https://res.cloudinary.com/demo/image/upload/v1/products/test.jpg",
        }),
      ),
    }),
  );
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  // Ensure schema is up to date
  const client = await pool.connect();
  try {
    await runMigrations(client);
  } finally {
    client.release();
  }

  // Register as customer, promote to admin via SQL.
  // This avoids hardcoding a bcrypt hash while giving us a real password.
  const adminReg = await request(app)
    .post("/api/v1/auth/register")
    .send({
      email: ADMIN_EMAIL,
      password: PASSWORD,
      firstName: "Upload",
      lastName: "Admin",
    });

  adminUserId = adminReg.body.data.user.id as string;

  await pool.query(
    "UPDATE users SET role = 'admin', email_verified = true WHERE id = $1",
    [adminUserId],
  );

  const adminLogin = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: ADMIN_EMAIL, password: PASSWORD });

  adminToken = adminLogin.body.data.accessToken as string;

  // Plain customer — used to test role rejection
  const custReg = await request(app)
    .post("/api/v1/auth/register")
    .send({
      email: CUSTOMER_EMAIL,
      password: PASSWORD,
      firstName: "Upload",
      lastName: "Customer",
    });

  customerUserId = custReg.body.data.user.id as string;

  const custLogin = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: CUSTOMER_EMAIL, password: PASSWORD });

  customerToken = custLogin.body.data.accessToken as string;
});

afterAll(async () => {
  if (adminUserId || customerUserId) {
    await pool.query("DELETE FROM users WHERE id = ANY($1)", [
      [adminUserId, customerUserId].filter(Boolean),
    ]);
  }
  await pool.end();
});

// Clear mock call history and restore default success behaviour between tests
// so a mockImplementationOnce override can't leak into subsequent tests.
afterEach(() => {
  jest.clearAllMocks();
  applyDefaultMock();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/v1/upload/image", () => {
  // ── Happy path ──────────────────────────────────────────────────────────────

  it("uploads an image and returns a Cloudinary CDN URL", async () => {
    const res = await request(app)
      .post("/api/v1/upload/image")
      .set("Authorization", `Bearer ${adminToken}`)
      .attach("file", TINY_PNG, {
        filename: "product.png",
        contentType: "image/png",
      })
      .field("removeBackground", "false");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.url).toBe("string");
    expect(res.body.data.url).toMatch(/^https:\/\/res\.cloudinary\.com\//);

    // Confirm the SDK was actually invoked (not silently skipped)
    expect(cloudinary.uploader.upload_stream).toHaveBeenCalledTimes(1);
  });

  it("passes removeBackground=true to the Cloudinary options", async () => {
    await request(app)
      .post("/api/v1/upload/image")
      .set("Authorization", `Bearer ${adminToken}`)
      .attach("file", TINY_PNG, {
        filename: "product.png",
        contentType: "image/png",
      })
      .field("removeBackground", "true");

    const [calledOptions] = (cloudinary.uploader.upload_stream as jest.Mock)
      .mock.calls[0] as [{ transformation?: unknown[] }, unknown];

    // When removeBackground is true, the service adds a transformation
    expect(calledOptions.transformation).toBeDefined();
  });

  // ── Auth guards ─────────────────────────────────────────────────────────────

  it("rejects request with no token → 401", async () => {
    const res = await request(app)
      .post("/api/v1/upload/image")
      .attach("file", TINY_PNG, {
        filename: "product.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");

    // Cloudinary must never be called for unauthenticated requests
    expect(cloudinary.uploader.upload_stream).not.toHaveBeenCalled();
  });

  it("rejects customer token → 403", async () => {
    const res = await request(app)
      .post("/api/v1/upload/image")
      .set("Authorization", `Bearer ${customerToken}`)
      .attach("file", TINY_PNG, {
        filename: "product.png",
        contentType: "image/png",
      })
      .field("removeBackground", "false");

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");

    expect(cloudinary.uploader.upload_stream).not.toHaveBeenCalled();
  });

  it("rejects malformed token → 401", async () => {
    const res = await request(app)
      .post("/api/v1/upload/image")
      .set("Authorization", "Bearer this.is.not.a.jwt")
      .attach("file", TINY_PNG, {
        filename: "product.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(401);
    expect(cloudinary.uploader.upload_stream).not.toHaveBeenCalled();
  });

  // ── Input validation ────────────────────────────────────────────────────────

  it("rejects request with no file attached → 400", async () => {
    const res = await request(app)
      .post("/api/v1/upload/image")
      .set("Authorization", `Bearer ${adminToken}`)
      .field("removeBackground", "false");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("NO_FILE");
    expect(cloudinary.uploader.upload_stream).not.toHaveBeenCalled();
  });

  it("rejects a non-image file (text/plain) → 400", async () => {
    const textBuffer = Buffer.from("not an image");

    const res = await request(app)
      .post("/api/v1/upload/image")
      .set("Authorization", `Bearer ${adminToken}`)
      .attach("file", textBuffer, {
        filename: "data.txt",
        contentType: "text/plain",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_FILE_TYPE");
    expect(cloudinary.uploader.upload_stream).not.toHaveBeenCalled();
  });

  it("rejects a file exceeding 20 MB → 400", async () => {
    // 21 MB buffer of zeroes
    const bigBuffer = Buffer.alloc(21 * 1024 * 1024);

    const res = await request(app)
      .post("/api/v1/upload/image")
      .set("Authorization", `Bearer ${adminToken}`)
      .attach("file", bigBuffer, {
        filename: "huge.jpg",
        contentType: "image/jpeg",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_FILE");
    expect(cloudinary.uploader.upload_stream).not.toHaveBeenCalled();
  });

  // ── Cloudinary failure ──────────────────────────────────────────────────────

  it("returns 500 when Cloudinary reports an error", async () => {
    // Suppress the expected console.error from the controller so test
    // output stays clean. The error is intentional here.
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    // Override for just this one test
    (cloudinary.uploader.upload_stream as jest.Mock).mockImplementationOnce(
      (
        _options: unknown,
        callback: (err: Error | null, result?: unknown) => void,
      ) => ({
        end: jest.fn(() => callback(new Error("Cloudinary quota exceeded"))),
      }),
    );

    const res = await request(app)
      .post("/api/v1/upload/image")
      .set("Authorization", `Bearer ${adminToken}`)
      .attach("file", TINY_PNG, {
        filename: "product.png",
        contentType: "image/png",
      })
      .field("removeBackground", "false");

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("UPLOAD_FAILED");
    expect(res.body.error.message).toBe("Cloudinary quota exceeded");

    spy.mockRestore();
  });
});
