import { pool } from "@/config/db";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export async function uniqueSlug(
  table: "products" | "categories",
  base: string,
  excludeId?: string,
): Promise<string> {
  const baseSlug = slugify(base);
  let slug = baseSlug;
  let n = 0;

  while (true) {
    const params = excludeId ? [slug, excludeId] : [slug];
    const condition = excludeId
      ? `WHERE slug = $1 AND id != $2`
      : `WHERE slug = $1`;

    const { rows } = await pool.query(
      `SELECT id FROM ${table} ${condition} LIMIT 1`,
      params,
    );

    if (rows.length === 0) return slug;
    slug = `${baseSlug}-${++n}`;
  }
}
