import { AuditLog, User } from "@storefront/types";

const isBrowser = typeof window !== "undefined";

// BROWSER: always use the relative proxy path (/api/backend/...) regardless of
// NEXT_PUBLIC_API_URL. This keeps every cookie on the same origin (localhost:3000
// in dev, your domain in prod) so the refresh-token Set-Cookie is stored and
// sent back automatically — no CORS, no sameSite, no secure-flag issues.
//
// SERVER (SSR): use NEXT_PUBLIC_API_URL for direct backend-to-backend calls.
// These never involve cookies so the env var is safe to use here.
//
// NEXT_PUBLIC_API_URL is still read by next.config.mjs (rewrite destination)
// and by any other file that needs it — nothing else changes.

if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is missing");
}
const _serverBase =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4000/api/v1";
const BASE_URL = isBrowser
  ? "/api/backend/api/v1"
  : _serverBase.endsWith("/api/v1")
    ? _serverBase
    : `${_serverBase}/api/v1`;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface FetchOptions extends RequestInit {
  token?: string;
  params?: Record<string, string | number | boolean | undefined>;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta?: unknown;
}

export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { token, params, ...fetchOptions } = options;

  // Strip /api/v1 prefix from endpoint if base already includes it
  let clean = endpoint.startsWith("/api/v1")
    ? endpoint.slice(7) // remove the 7 chars of '/api/v1'
    : endpoint;

  // Ensure clean always has a leading slash for the URL constructor
  if (!clean.startsWith("/")) {
    clean = `/${clean}`;
  }

  const rawHref = `${BASE_URL}${clean}`;
  const url = rawHref.startsWith("http")
    ? new URL(rawHref)
    : new URL(
        rawHref,
        typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost:3000",
      );
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v));
    });
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((fetchOptions.headers as Record<string, string>) ?? {}),
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(url.toString(), { ...fetchOptions, headers });

  if (!response.ok) {
    let code = "UNKNOWN_ERROR";
    let message = `HTTP ${response.status}`;
    try {
      const body = (await response.json()) as {
        error?: { code: string; message: string };
      };
      if (body.error) {
        code = body.error.code;
        message = body.error.message;
      }
    } catch {
      /* ignore parse errors */
    }
    throw new ApiError(message, code, response.status);
  }

  const json = (await response.json()) as {
    success: boolean;
    data: T;
    meta?: unknown;
  };
  return json.data;
}

export async function apiFetchWithMeta<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<{
  data: T;
  meta?: unknown;
}> {
  const { token, params, ...fetchOptions } = options;

  // Strip /api/v1 prefix from endpoint if base already includes it
  let clean = endpoint.startsWith("/api/v1")
    ? endpoint.slice(7) // remove the 7 chars of '/api/v1'
    : endpoint;

  // Ensure clean always has a leading slash for the URL constructor
  if (!clean.startsWith("/")) {
    clean = `/${clean}`;
  }

  const rawHref = `${BASE_URL}${clean}`;
  const url = rawHref.startsWith("http")
    ? new URL(rawHref)
    : new URL(
        rawHref,
        typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost:3000",
      );
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v));
    });
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((fetchOptions.headers as Record<string, string>) ?? {}),
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(url.toString(), { ...fetchOptions, headers });

  if (!response.ok) {
    let code = "UNKNOWN_ERROR";
    let message = `HTTP ${response.status}`;
    try {
      const body = (await response.json()) as {
        error?: { code: string; message: string };
      };
      if (body.error) {
        code = body.error.code;
        message = body.error.message;
      }
    } catch {
      /* ignore parse errors */
    }
    throw new ApiError(message, code, response.status);
  }

  const json = (await response.json()) as {
    success: boolean;
    data: T;
    meta?: unknown;
  };

  return {
    data: json.data,
    meta: json.meta,
  };
}


export async function apiFetchEnvelope<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<ApiEnvelope<T>> {
  const { token, params, ...fetchOptions } = options;

  let clean = endpoint.startsWith("/api/v1") ? endpoint.slice(7) : endpoint;

  if (!clean.startsWith("/")) {
    clean = `/${clean}`;
  }

  const rawHref = `${BASE_URL}${clean}`;

  const url = rawHref.startsWith("http")
    ? new URL(rawHref)
    : new URL(
        rawHref,
        typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost:3000",
      );

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) {
        url.searchParams.set(k, String(v));
      }
    });
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((fetchOptions.headers as Record<string, string>) ?? {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url.toString(), {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    let code = "UNKNOWN_ERROR";
    let message = `HTTP ${response.status}`;

    try {
      const body = (await response.json()) as {
        error?: {
          code: string;
          message: string;
        };
      };

      if (body.error) {
        code = body.error.code;
        message = body.error.message;
      }
    } catch {
      /* ignore */
    }

    throw new ApiError(message, code, response.status);
  }

  return (await response.json()) as ApiEnvelope<T>;
}
// ─── Typed API methods ────────────────────────────────────────────────────────

export const api = {
  // Products
  products: {
    list: (
      params?: Record<string, string | number | boolean | undefined>,
      token?: string,
    ) => apiFetch("/products", { params, token, next: { revalidate: 60 } }),
    bySlug: (slug: string) =>
      apiFetch(`/products/${slug}`, { next: { revalidate: 120 } }),
    featured: (limit = 8) =>
      apiFetch(`/products/featured?limit=${limit}`, {
        next: { revalidate: 300 },
      }),
    search: (q: string, params?: Record<string, string>) =>
      apiFetch("/products/search", {
        params: { q, ...params },
        cache: "no-store",
      }),
  },

  // Categories
  categories: {
    list: () => apiFetch("/categories", { next: { revalidate: 600 } }),
    bySlug: (slug: string) =>
      apiFetch(`/categories/${slug}`, { next: { revalidate: 300 } }),
  },

  // Banners
  banners: {
    active: (type?: string) =>
      apiFetch(`/banners${type ? `?type=${type}` : ""}`, {
        next: { revalidate: 60 },
      }),
  },

  // Auth
  // auth: {
  //   login: (email: string, password: string) =>
  //     apiFetch("/auth/login", {
  //       method: "POST",
  //       body: JSON.stringify({ email, password }),
  //       credentials: "include",
  //       cache: "no-store",
  //     }),
  //   register: (data: {
  //     email: string;
  //     password: string;
  //     firstName: string;
  //     lastName: string;
  //   }) =>
  //     apiFetch("/auth/register", {
  //       method: "POST",
  //       body: JSON.stringify(data),
  //       cache: "no-store",
  //     }),
  //   me: (token: string) => apiFetch("/auth/me", { token, cache: "no-store" }),
  //   logout: (token: string) =>
  //     apiFetch("/auth/logout", {
  //       method: "POST",
  //       token,
  //       credentials: "include",
  //       cache: "no-store",
  //     }),
  //   refresh: () =>
  //     apiFetch("/auth/refresh", {
  //       method: "POST",
  //       credentials: "include",
  //       cache: "no-store",
  //     }),
  // },

  auth: {
    login: (email: string, password: string) =>
      apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        credentials: "include",
        cache: "no-store",
      }),

    // ── NEW ──────────────────────────────────────────────────────────────────
    googleLogin: (idToken: string) =>
      apiFetch("/auth/google-login", {
        method: "POST",
        body: JSON.stringify({ idToken }),
        credentials: "include",
        cache: "no-store",
      }),
    // ─────────────────────────────────────────────────────────────────────────

    register: (data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    }) =>
      apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
        cache: "no-store",
      }),
    me: (token: string) => apiFetch("/auth/me", { token, cache: "no-store" }),
    logout: (token: string) =>
      apiFetch("/auth/logout", {
        method: "POST",
        token,
        credentials: "include",
        cache: "no-store",
      }),
    refresh: () =>
      apiFetch("/auth/refresh", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      }),
  },

  // Wishlist
  wishlist: {
    get: (token: string) => apiFetch("/wishlist", { token, cache: "no-store" }),
    add: (productId: string, token: string) =>
      apiFetch(`/wishlist/${productId}`, {
        method: "POST",
        token,
        cache: "no-store",
      }),
    remove: (productId: string, token: string) =>
      apiFetch(`/wishlist/${productId}`, {
        method: "DELETE",
        token,
        cache: "no-store",
      }),
  },

  // Reviews
  reviews: {
    list: (productId: string) =>
      apiFetch(`/reviews/product/${productId}`, { next: { revalidate: 120 } }),
    create: (
      data: {
        productId: string;
        rating: number;
        title?: string;
        body?: string;
      },
      token: string,
    ) =>
      apiFetch("/reviews", {
        method: "POST",
        body: JSON.stringify(data),
        token,
        cache: "no-store",
      }),
  },

  // Enquiries
  enquiries: {
    create: (data: {
      name: string;
      email: string;
      phone?: string;
      message: string;
      productId?: string;
    }) =>
      apiFetch("/enquiries", {
        method: "POST",
        body: JSON.stringify(data),
        cache: "no-store",
      }),
  },

  // AI
  ai: {
    chat: (
      message: string,
      sessionId: string,
      history: Array<{ role: string; content: string }>,
    ) =>
      apiFetch("/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message, sessionId, history }),
        cache: "no-store",
      }),

    generateProduct: (
      productName: string,
      externalLink?: string,
      token?: string,
      categoryKey?: string,
    ) =>
      apiFetch("/ai/generate-product", {
        method: "POST",
        body: JSON.stringify({
          productName,
          externalLink: externalLink || undefined,
          categoryKey: categoryKey || undefined,
        }),
        token,
        cache: "no-store",
      }),
  },

  // Config
  config: {
    public: () => apiFetch("/config/public", { next: { revalidate: 3600 } }),
  },

  // Admin
  admin: {
    stats: (token: string) =>
      apiFetch("/admin/stats", { token, cache: "no-store" }),

    // Products
    createProduct: (data: Record<string, unknown>, token: string) =>
      apiFetch("/products", {
        method: "POST",
        body: JSON.stringify(data),
        token,
        cache: "no-store",
      }),
    updateProduct: (id: string, data: Record<string, unknown>, token: string) =>
      apiFetch(`/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        token,
        cache: "no-store",
      }),
    deleteProduct: (id: string, token: string) =>
      apiFetch(`/products/${id}`, {
        method: "DELETE",
        token,
        cache: "no-store",
      }),
    toggleProduct: (id: string, token: string) =>
      apiFetch(`/products/${id}/toggle`, {
        method: "PATCH",
        token,
        cache: "no-store",
      }),
    listAllProducts: (
      token: string,
      params?: Record<string, string | number | boolean | undefined>,
    ) =>
      apiFetch("/products", {
        token,
        params: { ...params, limit: 50 },
        cache: "no-store",
      }),

    // Categories
    createCategory: (data: Record<string, unknown>, token: string) =>
      apiFetch("/categories", {
        method: "POST",
        body: JSON.stringify(data),
        token,
        cache: "no-store",
      }),
    updateCategory: (
      id: string,
      data: Record<string, unknown>,
      token: string,
    ) =>
      apiFetch(`/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        token,
        cache: "no-store",
      }),
    deleteCategory: (id: string, token: string) =>
      apiFetch(`/categories/${id}`, {
        method: "DELETE",
        token,
        cache: "no-store",
      }),
    listAllCategories: (token: string) =>
      apiFetch("/categories?all=true", { token, cache: "no-store" }),

    // Banners
    listAllBanners: (token: string) =>
      apiFetch("/banners/all", { token, cache: "no-store" }),
    createBanner: (data: Record<string, unknown>, token: string) =>
      apiFetch("/banners", {
        method: "POST",
        body: JSON.stringify(data),
        token,
        cache: "no-store",
      }),
    updateBanner: (id: string, data: Record<string, unknown>, token: string) =>
      apiFetch(`/banners/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        token,
        cache: "no-store",
      }),
    deleteBanner: (id: string, token: string) =>
      apiFetch(`/banners/${id}`, {
        method: "DELETE",
        token,
        cache: "no-store",
      }),

    // Discounts
    listAllDiscounts: (token: string) =>
      apiFetch("/discounts", { token, cache: "no-store" }),
    createDiscount: (data: Record<string, unknown>, token: string) =>
      apiFetch("/discounts", {
        method: "POST",
        body: JSON.stringify(data),
        token,
        cache: "no-store",
      }),
    updateDiscount: (
      id: string,
      data: Record<string, unknown>,
      token: string,
    ) =>
      apiFetch(`/discounts/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        token,
        cache: "no-store",
      }),
    deleteDiscount: (id: string, token: string) =>
      apiFetch(`/discounts/${id}`, {
        method: "DELETE",
        token,
        cache: "no-store",
      }),

    // Reviews
    listPendingReviews: (token: string) =>
      apiFetch("/reviews/pending", { token, cache: "no-store" }),
    approveReview: (id: string, token: string) =>
      apiFetch(`/reviews/${id}/approve`, {
        method: "PATCH",
        token,
        cache: "no-store",
      }),
    deleteReview: (id: string, token: string) =>
      apiFetch(`/reviews/${id}`, {
        method: "DELETE",
        token,
        cache: "no-store",
      }),

    // Enquiries
    listEnquiries: (token: string, params?: Record<string, string>) =>
      apiFetch("/enquiries", { token, params, cache: "no-store" }),
    updateEnquiryStatus: (id: string, status: string, token: string) =>
      apiFetch(`/enquiries/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
        token,
        cache: "no-store",
      }),
    deleteEnquiry: (id: string, token: string) =>
      apiFetch(`/enquiries/${id}`, {
        method: "DELETE",
        token,
        cache: "no-store",
      }),

    // Users
    listUsers: (token: string, params?: Record<string, string>) =>
      apiFetchWithMeta<User[]>("/users", { token, params, cache: "no-store" }),
    toggleUser: (id: string, token: string) =>
      apiFetch(`/users/${id}/toggle`, {
        method: "PATCH",
        token,
        cache: "no-store",
      }),
    changeUserRole: (id: string, role: string, token: string) =>
      apiFetch(`/users/${id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
        token,
        cache: "no-store",
      }),
    deleteUser: (id: string, token: string) =>
      apiFetch(`/users/${id}`, { method: "DELETE", token, cache: "no-store" }),
    listUsersPaginated: (
      token: string,
      params?: Record<string, string | number | boolean | undefined>,
    ) =>
      apiFetchEnvelope<User[]>("/users", {
        token,
        params,
        cache: "no-store",
      }),
    listAuditLogs: (
      token: string,
      params?: Record<string, string | number | boolean | undefined>,
    ) =>
      apiFetchEnvelope<AuditLog[]>("/users/audit-logs", {
        token,
        params,
        cache: "no-store",
      }),
    createUser: (
      data: {
        email: string;
        firstName: string;
        lastName: string;
        role: "customer" | "admin";
      },
      token: string,
    ) =>
      apiFetch("/users", {
        method: "POST",
        body: JSON.stringify(data),
        token,
        cache: "no-store",
      }),
  },
  upload: {
    /**
     * Uploads a single image file to the backend.
     * apiFetch cannot be used here because it forces Content-Type: application/json.
     * FormData uploads need the browser to set multipart/form-data + boundary itself.
     *
     * @param file          - The image File object to upload
     * @param removeBackground - Whether to apply AI background removal + gradient
     * @param token         - Admin access token
     * @returns             - The final CDN/storage URL string
     */
    image: async (
      file: File,
      removeBackground: boolean,
      token: string,
    ): Promise<string> => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("removeBackground", String(removeBackground));

      // Build the URL the same way apiFetch does (handles both browser + SSR)
      const rawHref = `${BASE_URL}/upload/image`;
      const url = rawHref.startsWith("http")
        ? rawHref
        : `${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}${rawHref}`;

      const res = await fetch(url, {
        method: "POST",
        // ← No Content-Type header: browser sets multipart/form-data + boundary
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });

      if (!res.ok) {
        let code = "UPLOAD_FAILED";
        let message = `Upload failed (HTTP ${res.status})`;
        try {
          const body = (await res.json()) as {
            error?: { code: string; message: string };
          };
          if (body.error) {
            code = body.error.code;
            message = body.error.message;
          }
        } catch {
          /* ignore */
        }
        throw new ApiError(message, code, res.status);
      }

      const json = (await res.json()) as {
        success: boolean;
        data: { url: string };
      };
      return json.data.url;
    },
  },
};
