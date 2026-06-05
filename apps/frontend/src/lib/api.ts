// ✅ Check if code is running in the browser window context
const isBrowser = typeof window !== "undefined";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
  : isBrowser
    ? "/api/backend/api/v1" // Browser client side calls route through our proxy
    : "http://localhost:4000/api/v1";

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

export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { token, params, ...fetchOptions } = options;

  // Build URL with query params
  const url = new URL(`${BASE_URL}${endpoint}`);
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
  auth: {
    login: (email: string, password: string) =>
      apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        credentials: "include",
        cache: "no-store",
      }),
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
  },

  // Config
  config: {
    public: () => apiFetch("/config/public", { next: { revalidate: 3600 } }),
  },
};
