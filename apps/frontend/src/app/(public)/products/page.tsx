import { Suspense } from "react";
import { apiFetch } from "@/lib/api";
import { ProductGrid } from "@/components/product/ProductGrid";
import { FilterSidebar } from "@/components/product/FilterSidebar";
import { Pagination } from "@/components/ui/Pagination";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { FadeIn } from "@/components/motion/FadeIn";

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
}
interface Category {
  id: string;
  name: string;
  slug: string;
}

async function getData(params: SearchParams) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) query.set(k, v);
  });
  if (!query.get("limit")) query.set("limit", "20");

  const [productsRes, catsRes] = await Promise.allSettled([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?${query}`, {
      cache: "no-store",
    }).then((r) => r.json()) as Promise<{ data: Product[]; meta: Meta }>,
    apiFetch<Category[]>("/categories", { next: { revalidate: 600 } }),
  ]);

  const products =
    productsRes.status === "fulfilled" ? productsRes.value.data : [];
  const meta =
    productsRes.status === "fulfilled" ? productsRes.value.meta : null;
  const categories = catsRes.status === "fulfilled" ? catsRes.value : [];

  const brandSet = new Set(
    products.filter((p) => p.brand).map((p) => p.brand as string),
  );

  return { products, meta, categories, brands: Array.from(brandSet).sort() };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { products, meta, categories, brands } = await getData(searchParams);

  const heading = searchParams.search
    ? `"${searchParams.search}"`
    : searchParams.categorySlug
      ? (categories.find((c) => c.slug === searchParams.categorySlug)?.name ??
        "Products")
      : "All Products";

  return (
    <div className="min-h-screen flex flex-col pt-24">
      {/* Ambient top glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(37,99,235,0.08) 0%, transparent 60%)",
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      <div className="container-wide py-12 relative z-10">
        <Breadcrumb
          items={[{ label: "Home", href: "/" }, { label: "Products" }]}
        />

        <div className="flex gap-10">
          {/* Sidebar */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <Suspense>
              <FilterSidebar categories={categories} brands={brands} />
            </Suspense>
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0">
            <FadeIn className="flex items-center justify-between mb-8 flex-wrap gap-4">
              <div>
                <h1 className="font-display font-black text-3xl text-white">
                  {heading}
                </h1>
                {meta && (
                  <p className="text-sm text-muted mt-1">
                    {meta.total} products
                  </p>
                )}
              </div>
            </FadeIn>

            <FadeIn variant="scale">
              <ProductGrid products={products} columns={3} />
            </FadeIn>

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
    </div>
  );
}
