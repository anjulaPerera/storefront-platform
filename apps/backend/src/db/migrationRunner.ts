import fs from "fs";
import path from "path";
import { PoolClient } from "pg";

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

export interface MigrationStatus {
  applied: string[];
  pending: string[];
}

async function ensureMigrationsTable(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS migrations_log (
      id        SERIAL PRIMARY KEY,
      filename  VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(client: PoolClient): Promise<Set<string>> {
  const { rows } = await client.query<{ filename: string }>(
    "SELECT filename FROM migrations_log ORDER BY filename",
  );
  return new Set(rows.map((r) => r.filename));
}

function getMigrationFiles(): string[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    throw new Error(`Migrations directory not found: ${MIGRATIONS_DIR}`);
  }
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

export async function getMigrationStatus(
  client: PoolClient,
): Promise<MigrationStatus> {
  await ensureMigrationsTable(client);
  const applied = await getAppliedMigrations(client);
  const all = getMigrationFiles();
  return {
    applied: all.filter((f) => applied.has(f)),
    pending: all.filter((f) => !applied.has(f)),
  };
}

export async function runMigrations(client: PoolClient): Promise<void> {
  await ensureMigrationsTable(client);

  const applied = await getAppliedMigrations(client);
  const allFiles = getMigrationFiles();
  const pending = allFiles.filter((f) => !applied.has(f));

  if (pending.length === 0) {
    console.log("✅  No pending migrations — database is up to date");
    return;
  }

  console.log(`🔄  Running ${pending.length} migration(s)...`);

  for (const filename of pending) {
    const filePath = path.join(MIGRATIONS_DIR, filename);
    const sql = fs.readFileSync(filePath, "utf-8");

    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO migrations_log (filename) VALUES ($1)", [
        filename,
      ]);
      await client.query("COMMIT");
      console.log(`  ✅  ${filename}`);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`  ❌  Failed on: ${filename}`);
      throw err;
    }
  }

  console.log("🎉  All migrations complete");
}
