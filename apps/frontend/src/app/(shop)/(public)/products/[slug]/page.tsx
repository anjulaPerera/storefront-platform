import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { tenantConfig } from "@storefront/config";
import { apiFetch } from "@/lib/api";
import { StarRating } from "@/components/ui/StarRating";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { WishlistButton } from "@/components/product/WishlistButton";
import { EnquiryButton } from "@/components/product/EnquiryButton";
import { ReviewSection } from "@/components/product/ReviewSection";
import { ProductImageGallery } from "../ProductImageGallery";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string | null;
  thumbnail: string | null;
  images: string[];
  brand: string | null;
  stockQuantity: number;
  externalLink: string | null;
  attributes: Record<string, unknown>;
  averageRating: number;
  reviewCount: number;
  activeDiscount?: { label: string | null };
  discountedPrice?: number;
  metaTitle: string | null;
  metaDescription: string | null;
  categoryName?: string;
  categorySlug?: string;
}

// AFTER
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const product = await apiFetch<Product>(`/products/${slug}`, {
      next: { revalidate: 600 },
    });
    console.log(JSON.stringify(product, null, 2));
    return {
      title: product.metaTitle ?? product.name,
      description: product.metaDescription ?? product.description ?? undefined,
      openGraph: {
        title: product.metaTitle ?? product.name,
        images: product.thumbnail ? [product.thumbnail] : [],
      },
    };
  } catch {
    return { title: "Product Not Found" };
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let product: Product;
  try {
        product = await apiFetch<Product>(`/products/${slug}`, {
          next: { revalidate: 600 },
        });

  } catch {
    notFound();
  }

  const { currencySymbol, locale } = tenantConfig.identity;
  const { features, externalLinks, productTaxonomy } = tenantConfig;

  const hasDiscount =
    product.discountedPrice !== undefined &&
    product.discountedPrice < product.price;
  const inStock = product.stockQuantity > 0;

  // Find which attributes to display using SSOT taxonomy
  const categoryKey = product.categorySlug ?? "";
  const taxonomyConfig = productTaxonomy.categories.find(
    (c) => c.key === categoryKey,
  );
  const specRows = taxonomyConfig
    ? taxonomyConfig.attributes
        .filter((attr) => product.attributes[attr.key] !== undefined)
        .map((attr) => ({
          label: attr.label,
          value: `${product.attributes[attr.key] as string}${attr.unit ? ` ${attr.unit}` : ""}`,
        }))
    : Object.entries(product.attributes).map(([k, v]) => ({
        label: k,
        value: String(v),
      }));

  // External spec link (e.g. GSM Arena)
  const extLinkConfig = externalLinks[categoryKey];
  const specLink =
    features.externalSpecLinks && product.externalLink && extLinkConfig
      ? { url: product.externalLink, label: extLinkConfig.label }
      : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-24">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Products", href: "/products" },
          ...(product.categoryName
            ? [
                {
                  label: product.categoryName,
                  href: `/categories/${product.categorySlug}`,
                },
              ]
            : []),
          { label: product.name },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
        {/* Image */}
        <ProductImageGallery
          productName={product.name}
          images={[
            ...(product.thumbnail ? [product.thumbnail] : []),
            ...product.images.filter((img) => img !== product.thumbnail),
          ]}
        />

        {/* Details */}
        <div className="flex flex-col">
          {product.brand && (
            <p className="text-sm text-white/50 mb-1">{product.brand}</p>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-white/80 mb-3">
            {product.name}
          </h1>

          {product.reviewCount > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <StarRating rating={product.averageRating} />
              <span className="text-sm text-white/70">
                {product.averageRating.toFixed(1)} ({product.reviewCount}{" "}
                reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-4">
            {hasDiscount ? (
              <>
                <span className="text-3xl font-bold text-primary">
                  {currencySymbol}
                  {product.discountedPrice!.toLocaleString(locale)}
                </span>
                <span className="text-xl text-white line-through">
                  {currencySymbol}
                  {product.price.toLocaleString(locale)}
                </span>
                {product.activeDiscount?.label && (
                  <Badge variant="danger">{product.activeDiscount.label}</Badge>
                )}
              </>
            ) : (
              <span className="text-3xl font-bold text-white">
                {currencySymbol}
                {product.price.toLocaleString(locale)}
              </span>
            )}
          </div>

          {/* Stock */}
          <div className="mb-6">
            {inStock ? (
              <Badge variant="success">
                In Stock ({product.stockQuantity} available)
              </Badge>
            ) : (
              <Badge variant="danger">Out of Stock</Badge>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-muted leading-relaxed mb-6">
              {product.description}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mb-6">
            {features.enquiryForm && (
              <EnquiryButton product={{ id: product.id, name: product.name }} />
            )}
            {features.wishlist && <WishlistButton productId={product.id} />}
          </div>

          {/* External spec link */}
          {specLink && (
            <a
              href={specLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              {specLink.label}
            </a>
          )}
        </div>
      </div>

      {/* Specifications table */}
      {specRows.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white/80 mb-4">
            Specifications
          </h2>
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <tbody>
                {specRows.map((row, idx) => (
                  <tr
                    key={row.label}
                    className={idx % 2 === 0 ? "bg-gray-800" : "bg-gray-900"}
                  >
                    <td className="px-4 py-3 text-white w-1/3 font-bold">
                      {row.label}
                    </td>
                    <td className="px-4 py-3 text-white">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Reviews */}
      {features.reviews && (
        <ReviewSection productId={product.id} productName={product.name} />
      )}
    </div>
  );
}