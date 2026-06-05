import { ProductCard } from "@/components/product/ProductCard";

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

interface ProductGridProps {
  products: Product[];
  columns?: 2 | 3 | 4;
}

const colClasses = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
};

export function ProductGrid({ products, columns = 4 }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-16 text-muted">
        <svg
          className="w-12 h-12 mx-auto mb-4 text-gray-200"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <p className="text-lg font-medium text-gray-400">No products found</p>
        <p className="text-sm mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className={`grid ${colClasses[columns]} gap-4`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
