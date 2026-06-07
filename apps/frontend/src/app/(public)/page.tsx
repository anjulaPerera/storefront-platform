import Image from "next/image";
import Link from "next/link";
import { tenantConfig } from "@storefront/config";
import { apiFetch } from "@/lib/api";
import { ProductGrid } from "@/components/product/ProductGrid";

export const dynamic = "force-dynamic";

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

interface Banner {
  id: string;
  content: string;
  linkUrl: string | null;
  linkText: string | null;
  backgroundColour: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  children?: Category[];
}

async function getData() {
  const [featured, promo, categories] = await Promise.allSettled([
    apiFetch<Product[]>("/products/featured?limit=8", {
      next: { revalidate: 300 },
    }),
    apiFetch<Banner[]>("/banners?type=promotional", {
      next: { revalidate: 60 },
    }),
    apiFetch<Category[]>("/categories", { next: { revalidate: 600 } }),
  ]);

  return {
    featured: featured.status === "fulfilled" ? featured.value : [],
    promoBanner: promo.status === "fulfilled" ? promo.value[0] : null,
    categories: categories.status === "fulfilled" ? categories.value : [],
  };
}

export default async function HomePage() {
  const { featured, promoBanner, categories } = await getData();
  const { pages, theme } = tenantConfig;

  return (
    <>
      {/* Hero */}
      <section
        className="relative py-20 px-4 text-white text-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${theme.primaryColorDark}, ${theme.primaryColor})`,
        }}
      >
        <div className="relative max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
            {pages.homepage.heroTitle}
          </h1>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            {pages.homepage.heroSubtitle}
          </p>
          <Link
            href={pages.homepage.heroCTALink}
            className="inline-block px-8 py-3 bg-white text-primary font-semibold rounded-full hover:bg-gray-50 transition-colors shadow-lg"
          >
            {pages.homepage.heroCTAText}
          </Link>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {pages.homepage.categorySectionTitle}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.slice(0, 8).map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="group flex flex-col items-center p-6 bg-surface rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all text-center"
              >
                {cat.imageUrl ? (
                  <Image
                    src={cat.imageUrl}
                    alt={cat.name}
                    width={64}
                    height={64}
                    className="mb-3 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 mb-3 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl text-primary font-bold">
                      {cat.name[0]}
                    </span>
                  </div>
                )}
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              {pages.homepage.featuredSectionTitle}
            </h2>
            <Link
              href="/products?featured=true"
              className="text-sm text-primary hover:underline"
            >
              View all →
            </Link>
          </div>
          <ProductGrid products={featured} columns={4} />
        </section>
      )}

      {/* Promotional banner */}
      {promoBanner && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              backgroundColor:
                promoBanner.backgroundColour ?? theme.accentColor,
            }}
          >
            <p
              className="text-lg font-medium"
              dangerouslySetInnerHTML={{ __html: promoBanner.content }}
            />
            {promoBanner.linkUrl && (
              <Link
                href={promoBanner.linkUrl}
                className="inline-block mt-4 px-6 py-2 bg-white text-foreground font-medium rounded-full hover:bg-gray-50 transition-colors"
              >
                {promoBanner.linkText ?? "Learn more"}
              </Link>
            )}
          </div>
        </section>
      )}
    </>
  );
}
