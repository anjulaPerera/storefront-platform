import "dotenv/config";
import { pool } from "@/config/db";
import { runMigrations } from "@/db/migrationRunner";

if (process.env.NODE_ENV === "production") {
  console.error("❌  reset.ts cannot run in production");
  process.exit(1);
}

async function main(): Promise<void> {
  const client = await pool.connect();
  try {
    console.log("⚠️   Dropping all tables...");

    await client.query(`
      DROP TABLE IF EXISTS
        ai_conversations,
        wishlists,
        reviews,
        discounts,
        banners,
        products,
        categories,
        users,
        migrations_log
      CASCADE
    `);

    // Drop custom types/functions
    await client.query(`
      DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
      DROP FUNCTION IF EXISTS products_search_vector_update CASCADE;
    `);

    console.log("✅  All tables dropped");
    await runMigrations(client);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err: Error) => {
  console.error("❌  Reset failed:", err.message);
  process.exit(1);
});
