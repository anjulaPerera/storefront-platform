import "dotenv/config";
import bcrypt from "bcrypt";
import { pool } from "@/config/db";

async function seedAdmin(): Promise<void> {
  const client = await pool.connect();

  try {
    const email = process.env.ADMIN_EMAIL ?? "admin@rangaphones.lk";
    const password = process.env.ADMIN_PASSWORD ?? "Admin@123456";
    const firstName = "Shop";
    const lastName = "Admin";

    const { rows } = await client.query<{ id: string }>(
      "SELECT id FROM users WHERE email = $1",
      [email],
    );

    if (rows.length > 0) {
      console.log(`⚠️   Admin already exists: ${email}`);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await client.query(
      `INSERT INTO users
         (email, password_hash, first_name, last_name, role, is_active, email_verified)
       VALUES ($1, $2, $3, $4, 'admin', true, true)`,
      [email, passwordHash, firstName, lastName],
    );

    console.log(`✅  Admin created: ${email}`);
    console.log(`    Password: ${password}`);
    console.log(`    ⚠️   Change this password immediately in production!`);
  } finally {
    client.release();
    await pool.end();
  }
}

seedAdmin().catch((err: Error) => {
  console.error("❌  Admin seed failed:", err.message);
  process.exit(1);
});
