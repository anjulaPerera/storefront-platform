import { pool } from "@/config/db";
import { createError } from "@/middleware/error.middleware";

export interface Banner {
  id: string;
  type: "top_strip" | "hero" | "promotional";
  content: string;
  linkUrl: string | null;
  linkText: string | null;
  backgroundColour: string | null;
  textColour: string | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

function mapBanner(row: Record<string, unknown>): Banner {
  return {
    id: row.id as string,
    type: row.type as Banner["type"],
    content: row.content as string,
    linkUrl: row.link_url as string | null,
    linkText: row.link_text as string | null,
    backgroundColour: row.background_colour as string | null,
    textColour: row.text_colour as string | null,
    startsAt: row.starts_at ? (row.starts_at as Date).toISOString() : null,
    endsAt: row.ends_at ? (row.ends_at as Date).toISOString() : null,
    isActive: row.is_active as boolean,
    sortOrder: row.sort_order as number,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

const ACTIVE_WHERE = `
  WHERE is_active = true
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at   IS NULL OR ends_at   >  NOW())
`;

export async function listActiveBanners(type?: string): Promise<Banner[]> {
  const typeClause = type ? `AND type = $1` : "";
  const params = type ? [type] : [];
  const { rows } = await pool.query(
    `SELECT * FROM banners ${ACTIVE_WHERE} ${typeClause} ORDER BY sort_order`,
    params,
  );
  return rows.map((r) => mapBanner(r as Record<string, unknown>));
}

export async function listAllBanners(): Promise<Banner[]> {
  const { rows } = await pool.query(
    "SELECT * FROM banners ORDER BY sort_order, created_at DESC",
  );
  return rows.map((r) => mapBanner(r as Record<string, unknown>));
}

export async function createBanner(data: {
  type: Banner["type"];
  content: string;
  linkUrl?: string | null;
  linkText?: string | null;
  backgroundColour?: string | null;
  textColour?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}): Promise<Banner> {
  const { rows } = await pool.query(
    `INSERT INTO banners
       (type, content, link_url, link_text, background_colour, text_colour,
        starts_at, ends_at, is_active, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      data.type,
      data.content,
      data.linkUrl ?? null,
      data.linkText ?? null,
      data.backgroundColour ?? null,
      data.textColour ?? null,
      data.startsAt ?? null,
      data.endsAt ?? null,
      data.isActive ?? true,
      data.sortOrder ?? 0,
    ],
  );
  return mapBanner(rows[0] as Record<string, unknown>);
}

export async function updateBanner(
  id: string,
  data: Partial<Parameters<typeof createBanner>[0]>,
): Promise<Banner> {
  const { rows } = await pool.query(
    `UPDATE banners SET
       type              = COALESCE($1,  type),
       content           = COALESCE($2,  content),
       link_url          = COALESCE($3,  link_url),
       link_text         = COALESCE($4,  link_text),
       background_colour = COALESCE($5,  background_colour),
       text_colour       = COALESCE($6,  text_colour),
       starts_at         = COALESCE($7,  starts_at),
       ends_at           = COALESCE($8,  ends_at),
       is_active         = COALESCE($9,  is_active),
       sort_order        = COALESCE($10, sort_order)
     WHERE id = $11
     RETURNING *`,
    [
      data.type ?? null,
      data.content ?? null,
      data.linkUrl,
      data.linkText,
      data.backgroundColour,
      data.textColour,
      data.startsAt,
      data.endsAt,
      data.isActive ?? null,
      data.sortOrder ?? null,
      id,
    ],
  );
  if (rows.length === 0)
    throw createError("Banner not found", 404, "NOT_FOUND");
  return mapBanner(rows[0] as Record<string, unknown>);
}

export async function deleteBanner(id: string): Promise<void> {
  const { rowCount } = await pool.query("DELETE FROM banners WHERE id = $1", [
    id,
  ]);
  if ((rowCount ?? 0) === 0)
    throw createError("Banner not found", 404, "NOT_FOUND");
}
