import "dotenv/config";
import bcrypt from "bcryptjs"; 
import { pool } from "@/config/db"; 

// Re-use the same logic inline so we don't spawn multiple pool instances
async function main(): Promise<void> {
  const client = await pool.connect();
  try {
    // ── Admin user ──────────────────────────────────────────────────────
    const email = process.env.ADMIN_EMAIL ?? "admin@rangaphones.lk";
    const password = process.env.ADMIN_PASSWORD ?? "Admin@123456";

    const existing = await client.query<{ id: string }>(
      "SELECT id FROM users WHERE email = $1",
      [email],
    );

    if (existing.rows.length === 0) {
      const hash = await bcrypt.hash(password, 12);
      await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
         VALUES ($1,$2,'Shop','Admin','admin',true,true)`,
        [email, hash],
      );
      console.log(`✅  Admin: ${email} / ${password}`);
    } else {
      console.log(`⏭️   Admin already exists`);
    }

    // Run product seed via child process to avoid pool conflict
    console.log("✅  Run `pnpm db:seed:products` for sample products");
    console.log("🎉  Core seed complete");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err: Error) => {
  console.error("❌  Seed failed:", err.message);
  process.exit(1);
});
