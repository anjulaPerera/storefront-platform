// ─── API Response Envelope ──────────────────────────────────────────────────
export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ─── Entities ───────────────────────────────────────────────────────────────
export type UserRole = "customer" | "admin" | "super_admin";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  children?: Category[];
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stockQuantity: number;
  sku: string | null;
  brand: string | null;
  attributes: Record<string, unknown>;
  images: string[];
  thumbnail: string | null;
  externalLink: string | null;
  isFeatured: boolean;
  isActive: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
  // Computed (joined)
  category?: Category;
  activeDiscount?: Discount;
  discountedPrice?: number;
  averageRating?: number;
  reviewCount?: number;
}

export interface Discount {
  id: string;
  productId: string | null;
  categoryId: string | null;
  type: "percentage" | "fixed_amount";
  value: number;
  label: string | null;
  startsAt: string;
  endsAt: string | null;
  isActive: boolean;
}

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
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string | null;
  body: string | null;
  isApproved: boolean;
  createdAt: string;
  user?: Pick<User, "firstName" | "lastName">;
}

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
  product?: Pick<Product, "name" | "slug">;
}
