import { ProductGrid } from "@/components/product/ProductGrid";
import { FadeIn } from "@/components/motion/FadeIn";

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
      const res = (await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products?search=${encodeURIComponent(query)}&limit=24`,
        { cache: "no-store" },
      ).then((r) => r.json())) as { data: Product[] };
      products = res.data ?? [];
    } catch {
      /* empty */
    }
  }

  return (
    <div className="min-h-screen pt-28">
      {/* Ambient glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(37,99,235,0.08), transparent 60%)",
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      <div className="container-wide py-12 relative z-10">
        <FadeIn>
          {query ? (
            <div className="mb-10">
              <p className="badge-amber mb-4">Search Results</p>
              <h1 className="font-display font-black text-3xl md:text-4xl text-white">
                {products.length > 0 ? (
                  <>
                    {products.length} results for{" "}
                    <span className="text-gradient">&ldquo;{query}&rdquo;</span>
                  </>
                ) : (
                  <>
                    No results for{" "}
                    <span className="text-white/40">&ldquo;{query}&rdquo;</span>
                  </>
                )}
              </h1>
            </div>
          ) : (
            <div className="text-center py-24">
              <div className="w-16 h-16 rounded-2xl glass border border-border-mid flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-white/30"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h1 className="font-display font-black text-3xl text-white mb-3">
                Search Products
              </h1>
              <p className="text-muted max-w-sm mx-auto">
                Click the search icon in the navbar to find phones, brands, and
                accessories.
              </p>
            </div>
          )}
        </FadeIn>

        {products.length > 0 ? (
          <FadeIn variant="scale">
            <ProductGrid products={products} columns={4} />
          </FadeIn>
        ) : query ? (
          <FadeIn>
            <div className="text-center py-20 glass rounded-3xl border border-border">
              <p className="text-2xl mb-3">🔍</p>
              <p className="font-display font-bold text-lg text-white mb-2">
                No products match that search
              </p>
              <p className="text-sm text-muted">
                Try a different brand name, model, or category.
              </p>
            </div>
          </FadeIn>
        ) : null}
      </div>
    </div>
  );
}
