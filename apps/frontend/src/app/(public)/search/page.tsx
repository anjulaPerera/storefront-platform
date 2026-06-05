import { apiFetch } from "@/lib/api";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

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

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = searchParams.q?.trim() ?? "";
  let products: Product[] = [];

  if (query) {
    try {
      products = await apiFetch<Product[]>(
        `/products/search?q=${encodeURIComponent(query)}`,
        {
          cache: "no-store",
        },
      );
    } catch {
      /* empty results on error */
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Search" }]} />
      <h1 className="text-2xl font-bold text-foreground mb-6">
        {query ? `Results for "${query}"` : "Search Products"}
      </h1>
      {!query ? (
        <p className="text-muted">
          Enter a search term in the navigation bar to find products.
        </p>
      ) : (
        <ProductGrid products={products} columns={4} />
      )}
    </div>
  );
}
