import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { apiFetch } from "@/lib/api";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

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
}: {
  params: { slug: string };
}) {
  let category: Category;
  let products: Product[] = [];

  try {
    [category] = await Promise.all([
      apiFetch<Category>(`/categories/${params.slug}`, {
        next: { revalidate: 300 },
      }),
    ]);
    const res = (await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/products?categorySlug=${params.slug}&limit=20`,
      { next: { revalidate: 300 } },
    ).then((r) => r.json())) as { data: Product[] };
    products = res.data;
  } catch {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Products", href: "/products" },
          { label: category.name },
        ]}
      />
      <h1 className="text-2xl font-bold text-foreground mb-2">
        {category.name}
      </h1>
      {category.description && (
        <p className="text-muted mb-6">{category.description}</p>
      )}
      <ProductGrid products={products} columns={4} />
    </div>
  );
}
