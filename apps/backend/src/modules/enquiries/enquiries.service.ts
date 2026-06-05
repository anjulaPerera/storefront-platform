import { pool } from "@/config/db";
import { createError } from "@/middleware/error.middleware";
import { sendEnquiryNotification } from "@/utils/email.utils";
import { PaginationParams, buildMeta, offset } from "@/utils/pagination.utils";

export interface Enquiry {
  id: string;
  userId: string | null;
  productId: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: "open" | "replied" | "closed";
  createdAt: string;
  productName?: string;
  productSlug?: string;
}

function mapEnquiry(row: Record<string, unknown>): Enquiry {
  return {
    id: row.id as string,
    userId: row.user_id as string | null,
    productId: row.product_id as string | null,
    name: row.name as string,
    email: row.email as string,
    phone: row.phone as string | null,
    message: row.message as string,
    status: row.status as Enquiry["status"],
    createdAt: (row.created_at as Date).toISOString(),
    productName: row.product_name as string | undefined,
    productSlug: row.product_slug as string | undefined,
  };
}

export async function listEnquiries(
  pagination: PaginationParams,
  status?: string,
): Promise<{ enquiries: Enquiry[]; meta: ReturnType<typeof buildMeta> }> {
  const statusClause = status ? `AND e.status = '${status}'` : "";

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*)::INT AS total FROM enquiries e WHERE 1=1 ${statusClause}`,
  );
  const total = (countRows[0] as { total: number }).total;

  const { rows } = await pool.query(
    `SELECT e.*, p.name AS product_name, p.slug AS product_slug
     FROM enquiries e
     LEFT JOIN products p ON p.id = e.product_id
     WHERE 1=1 ${statusClause}
     ORDER BY e.created_at DESC
     LIMIT $1 OFFSET $2`,
    [pagination.limit, offset(pagination)],
  );

  return {
    enquiries: rows.map((r) => mapEnquiry(r as Record<string, unknown>)),
    meta: buildMeta(total, pagination),
  };
}

export async function getEnquiryById(id: string): Promise<Enquiry> {
  const { rows } = await pool.query(
    `SELECT e.*, p.name AS product_name, p.slug AS product_slug
     FROM enquiries e
     LEFT JOIN products p ON p.id = e.product_id
     WHERE e.id = $1`,
    [id],
  );
  if (rows.length === 0)
    throw createError("Enquiry not found", 404, "NOT_FOUND");
  return mapEnquiry(rows[0] as Record<string, unknown>);
}

export async function createEnquiry(
  data: {
    name: string;
    email: string;
    phone?: string;
    message: string;
    productId?: string;
  },
  userId?: string,
): Promise<Enquiry> {
  let productName: string | undefined;

  if (data.productId) {
    const { rows } = await pool.query(
      "SELECT name FROM products WHERE id = $1",
      [data.productId],
    );
    if (rows.length > 0) productName = (rows[0] as { name: string }).name;
  }

  const { rows } = await pool.query(
    `INSERT INTO enquiries (user_id, product_id, name, email, phone, message)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [
      userId ?? null,
      data.productId ?? null,
      data.name,
      data.email,
      data.phone ?? null,
      data.message,
    ],
  );

  const enquiry = mapEnquiry(rows[0] as Record<string, unknown>);

  // Notify admin — non-blocking
  const adminEmail = process.env.SUPPORT_EMAIL ?? process.env.FROM_EMAIL ?? "";
  if (adminEmail) {
    sendEnquiryNotification(
      adminEmail,
      data.name,
      data.email,
      data.message,
      productName,
    ).catch(console.error);
  }

  return enquiry;
}

export async function updateStatus(
  id: string,
  status: "open" | "replied" | "closed",
): Promise<Enquiry> {
  const { rows } = await pool.query(
    "UPDATE enquiries SET status = $1 WHERE id = $2 RETURNING *",
    [status, id],
  );
  if (rows.length === 0)
    throw createError("Enquiry not found", 404, "NOT_FOUND");
  return mapEnquiry(rows[0] as Record<string, unknown>);
}

export async function deleteEnquiry(id: string): Promise<void> {
  const { rowCount } = await pool.query("DELETE FROM enquiries WHERE id = $1", [
    id,
  ]);
  if ((rowCount ?? 0) === 0)
    throw createError("Enquiry not found", 404, "NOT_FOUND");
}
