import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { apiFetch } from "@/lib/api";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { FadeIn } from "@/components/motion/FadeIn";
import { FilterSidebar } from "@/components/product/FilterSidebar";

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
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const cat = await apiFetch<Category>(`/categories/${slug}`);
    return { title: cat.name, description: cat.description ?? undefined };
  } catch {
    return { title: "Category" };
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    brand?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}) {
  const { slug } = await params;
  const { brand, sort, minPrice, maxPrice } = await searchParams;

  // 1. Data Fetching
  let category: Category;
  try {
    category = await apiFetch<Category>(`/categories/${slug}`, {
      next: { revalidate: 300 },
    });
  } catch {
    notFound();
  }

  const qs = new URLSearchParams({
    categorySlug: slug,
    limit: "24",
    ...(brand && { brand: brand }),
    ...(sort && { sort: sort }),
    ...(minPrice && { minPrice: minPrice }),
    ...(maxPrice && { maxPrice: maxPrice }),
  });

  const [productsRes, categoriesRes] = await Promise.allSettled([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?${qs.toString()}`, {
      next: { revalidate: 300 },
    }).then((r) => r.json()),
    apiFetch<Category[]>("/categories", { next: { revalidate: 600 } }),
  ]);

  const products: Product[] =
    productsRes.status === "fulfilled" && productsRes.value?.data
      ? productsRes.value.data
      : [];
  const allCategories: Category[] =
    categoriesRes.status === "fulfilled"
      ? (categoriesRes.value as Category[])
      : [];

  // 2. Brand Logic
  let brands: string[] = [];
  if (slug === "accessories") {
    const baseAccessories = [
      "Anker",
      "Baseus",
      "Ugreen",
      "Remax",
      "Joyroom",
      "Samsung",
      "Apple",
      "Xiaomi",
      "Havit",
      "LDNIO",
    ];
    const productBrands = Array.from(
      new Set(products.map((p) => p.brand).filter(Boolean) as string[]),
    );
    brands = Array.from(new Set([...baseAccessories, ...productBrands])).sort(
      (a, b) => a.localeCompare(b),
    );
  } else {
    const brandSet = new Set(
      products.filter((p) => p?.brand).map((p) => p.brand as string),
    );
    brands = Array.from(brandSet).sort((a, b) => a.localeCompare(b));
  }

  const heroColors: Record<string, string> = {
    smartphones: "rgba(37,99,235,0.35)",
    tablets: "rgba(124,58,237,0.3)",
    accessories: "rgba(245,158,11,0.25)",
  };
  const glow = heroColors[slug] ?? "rgba(37,99,235,0.25)";

  return (
    <div className="min-h-screen">
      <section
        className="relative pt-32 pb-20 text-center overflow-hidden"
        style={{
          background: `radial-gradient(ellipse 70% 60% at 50% 0%, ${glow} 0%, transparent 65%), #050816`,
        }}
      >
        <div className="relative z-10 container-wide">
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Products", href: "/products" },
              { label: category.name },
            ]}
          />
          <FadeIn>
            <h1 className="font-display font-black text-hero text-white mt-6 mb-4">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-black max-w-lg mx-auto text-lg">
                {category.description}
              </p>
            )}
            <p className="text-sm text-dim mt-4">{products.length} products</p>
          </FadeIn>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-space-1 to-transparent pointer-events-none" />
      </section>

      <section className="container-wide py-16 flex gap-10">
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <FilterSidebar
            categories={allCategories}
            brands={brands}
            showCategories={false}
          />
        </aside>
        <div className="flex-1 min-w-0">
          <FadeIn variant="scale">
            <ProductGrid products={products} columns={4} />
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
