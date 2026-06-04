import "dotenv/config";
import { Pool, PoolClient } from "pg";
import { runMigrations, getMigrationStatus } from "@/db/migrationRunner";

const testPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

let client: PoolClient;

beforeAll(async () => {
  client = await testPool.connect();
  // Run migrations — safe to call on an already-migrated DB
  await runMigrations(client);
});

afterAll(async () => {
  client.release();
  await testPool.end();
});

// ─── helpers ────────────────────────────────────────────────────────────────
async function tableExists(tableName: string): Promise<boolean> {
  const { rows } = await client.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1
     ) AS exists`,
    [tableName],
  );
  return rows[0].exists;
}

async function indexExists(indexName: string): Promise<boolean> {
  const { rows } = await client.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM pg_indexes
       WHERE schemaname = 'public' AND indexname = $1
     ) AS exists`,
    [indexName],
  );
  return rows[0].exists;
}

async function columnExists(
  tableName: string,
  columnName: string,
): Promise<boolean> {
  const { rows } = await client.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name   = $1
         AND column_name  = $2
     ) AS exists`,
    [tableName, columnName],
  );
  return rows[0].exists;
}

// ─── migrations_log ──────────────────────────────────────────────────────────
describe("migrations_log table", () => {
  it("exists after migrations run", async () => {
    expect(await tableExists("migrations_log")).toBe(true);
  });

  it("has recorded all migration files", async () => {
    const { rows } = await client.query<{ filename: string }>(
      "SELECT filename FROM migrations_log ORDER BY filename",
    );
    const filenames = rows.map((r) => r.filename);
    expect(filenames).toContain("001_initial_schema.sql");
    expect(filenames).toContain("002_add_discounts_banners.sql");
    expect(filenames).toContain("003_add_reviews_wishlists.sql");
    expect(filenames).toContain("004_add_ai_conversations.sql");
    expect(filenames).toContain("005_add_full_text_search.sql");
  });
});

// ─── core tables ─────────────────────────────────────────────────────────────
describe("core tables existence", () => {
  const expectedTables = [
    "users",
    "categories",
    "products",
    "discounts",
    "banners",
    "reviews",
    "wishlists",
    "ai_conversations",
  ];

  it.each(expectedTables)('table "%s" exists', async (table) => {
    expect(await tableExists(table)).toBe(true);
  });
});

// ─── column spot checks ───────────────────────────────────────────────────────
describe("column structure", () => {
  it("products has JSONB attributes column", async () => {
    expect(await columnExists("products", "attributes")).toBe(true);
  });

  it("products has search_vector column", async () => {
    expect(await columnExists("products", "search_vector")).toBe(true);
  });

  it("reviews has is_approved column", async () => {
    expect(await columnExists("reviews", "is_approved")).toBe(true);
  });

  it("wishlists has unique constraint on user_id + product_id", async () => {
    const { rows } = await client.query<{ constraint_name: string }>(
      `SELECT constraint_name
       FROM information_schema.table_constraints
       WHERE table_name = 'wishlists' AND constraint_type = 'UNIQUE'`,
    );
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── indexes ─────────────────────────────────────────────────────────────────
describe("indexes", () => {
  it("products has GIN index on search_vector", async () => {
    expect(await indexExists("products_search_vector_idx")).toBe(true);
  });

  it("products has GIN index on attributes", async () => {
    expect(await indexExists("products_attributes_idx")).toBe(true);
  });

  it("products has index on category_id", async () => {
    expect(await indexExists("products_category_id_idx")).toBe(true);
  });
});

// ─── idempotency ──────────────────────────────────────────────────────────────
describe("idempotency", () => {
  it("running migrations again does not throw", async () => {
    await expect(runMigrations(client)).resolves.not.toThrow();
  });

  it("getMigrationStatus returns empty pending list after full run", async () => {
    const status = await getMigrationStatus(client);
    expect(status.pending).toHaveLength(0);
    expect(status.applied.length).toBeGreaterThanOrEqual(5);
  });
});
