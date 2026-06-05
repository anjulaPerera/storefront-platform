import { Suspense } from "react";
import { apiFetch } from "@/lib/api";
import { ProductGrid } from "@/components/product/ProductGrid";
import { FilterSidebar } from "@/components/product/FilterSidebar";
import { Pagination } from "@/components/ui/Pagination";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

interface SearchParams {
  page?: string;
  limit?: string;
  categorySlug?: string;
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  search?: string;
  featured?: string;
  inStock?: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  thumbnail: string | null;
  brand: string | null;
  stockQuantity: number;
  averageRating: number;
  reviewCount: number;
  activeDiscount?: { label: string | null };
  discountedPrice?: number;
}

interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  children?: Category[];
}

async function getProducts(params: SearchParams) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) query.set(k, v);
  });
  if (!query.get("limit")) query.set("limit", "20");

  const [productsRes, categoriesRes] = await Promise.allSettled([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?${query.toString()}`, {
      cache: "no-store",
    }).then((r) => r.json()) as Promise<{ data: Product[]; meta: Meta }>,
    apiFetch<Category[]>("/categories", { next: { revalidate: 600 } }),
  ]);

  const products =
    productsRes.status === "fulfilled" ? productsRes.value.data : [];
  const meta =
    productsRes.status === "fulfilled" ? productsRes.value.meta : null;
  const categories =
    categoriesRes.status === "fulfilled" ? categoriesRes.value : [];

  // Extract unique brands for filter
  const brandSet = new Set(
    products.filter((p) => p.brand).map((p) => p.brand as string),
  );
  const brands = Array.from(brandSet).sort();

  return { products, meta, categories, brands };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { products, meta, categories, brands } =
    await getProducts(searchParams);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: "Products" }]}
      />

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <Suspense>
            <FilterSidebar categories={categories} brands={brands} />
          </Suspense>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-foreground">
              {searchParams.search
                ? `Search: "${searchParams.search}"`
                : searchParams.categorySlug
                  ? (categories.find(
                      (c) => c.slug === searchParams.categorySlug,
                    )?.name ?? "Products")
                  : "All Products"}
            </h1>
            {meta && (
              <p className="text-sm text-muted">{meta.total} products</p>
            )}
          </div>

          <ProductGrid products={products} columns={3} />

          {meta && meta.totalPages > 1 && (
            <Suspense>
              <Pagination
                currentPage={meta.page}
                totalPages={meta.totalPages}
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}
