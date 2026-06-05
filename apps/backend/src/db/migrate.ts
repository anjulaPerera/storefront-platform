import "dotenv/config";
import { pool } from "@/config/db";
import { runMigrations } from "@/db/migrationRunner";

async function main(): Promise<void> {
  const client = await pool.connect();
  try {
    await runMigrations(client);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err: Error) => {
  console.error("❌  Migration failed:", err.message);
  process.exit(1);
});
