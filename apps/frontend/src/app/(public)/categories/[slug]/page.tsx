import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { apiFetch } from "@/lib/api";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { FadeIn } from "@/components/motion/FadeIn";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
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

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const cat = await apiFetch<Category>(`/categories/${params.slug}`);
    return { title: cat.name, description: cat.description ?? undefined };
  } catch {
    return { title: "Category" };
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { brand?: string; sort?: string };
}) {
  // ── 1. Category is critical — 404 if missing ──────────────────────────
  let category: Category;
  try {
    category = await apiFetch<Category>(`/categories/${params.slug}`, {
      next: { revalidate: 300 },
    });
  } catch {
    notFound();
  }

  // ── 2. Products list is non-critical — degrade to empty grid ──────────
  let products: Product[] = [];
  try {
    const qs = new URLSearchParams({
      categorySlug: params.slug,
      limit: "24",
    });
    if (searchParams.brand) qs.set("brand", searchParams.brand);
    if (searchParams.sort) qs.set("sort", searchParams.sort);

    const res = (await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/products?${qs.toString()}`,
      { next: { revalidate: 300 } },
    ).then((r) => r.json())) as { data: Product[] };

    products = res.data ?? [];
  } catch (err) {
    console.error(
      "[SSR] products fetch failed for category:",
      params.slug,
      err,
    );
  }


  // Hero gradient per category
  const heroColors: Record<string, string> = {
    smartphones: "rgba(37,99,235,0.35)",
    tablets: "rgba(124,58,237,0.3)",
    accessories: "rgba(245,158,11,0.25)",
  };
  const glow = heroColors[params.slug] ?? "rgba(37,99,235,0.25)";

  return (
    <div className="min-h-screen">
      {/* Category Hero */}
      <section
        className="relative pt-32 pb-20 text-center overflow-hidden"
        style={{
          background: `radial-gradient(ellipse 70% 60% at 50% 0%, ${glow} 0%, transparent 65%), #050816`,
        }}
      >
        {/* Stars */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
        >
          {Array.from({ length: 50 }, (_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white animate-twinkle"
              style={{
                top: `${(i * 37) % 100}%`,
                left: `${(i * 53) % 100}%`,
                width: `${((i * 7) % 2) + 1}px`,
                height: `${((i * 7) % 2) + 1}px`,
                opacity: ((i * 11) % 50) / 100 + 0.1,
                animationDelay: `${((i * 3) % 30) / 10}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 container-wide">
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Products", href: "/products" },
              { label: category!.name },
            ]}
          />

          <FadeIn>
            <h1 className="font-display font-black text-hero text-white mt-6 mb-4">
              {category!.name}
            </h1>
            {category!.description && (
              <p className="text-muted max-w-lg mx-auto text-lg">
                {category!.description}
              </p>
            )}
            <p className="text-sm text-dim mt-4">{products.length} products</p>
          </FadeIn>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-space-1 to-transparent pointer-events-none" />
      </section>

      {/* Products */}
      <section className="container-wide py-16">
        <FadeIn variant="scale">
          <ProductGrid products={products} columns={4} />
        </FadeIn>
      </section>
    </div>
  );
}
