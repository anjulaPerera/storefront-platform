import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';
import { tenantConfig } from '@storefront/config';
import { apiFetch } from '@/lib/api';
import { StarRating } from '@/components/ui/StarRating';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { WishlistButton } from '@/components/product/WishlistButton';
import { EnquiryButton } from '@/components/product/EnquiryButton';
import { ReviewSection } from '@/components/product/ReviewSection';

interface Product {
  id: string; name: string; slug: string; price: number;
  description: string | null; thumbnail: string | null; images: string[];
  brand: string | null; stockQuantity: number; externalLink: string | null;
  attributes: Record<string, unknown>; averageRating: number; reviewCount: number;
  activeDiscount?: { label: string | null }; discountedPrice?: number;
  metaTitle: string | null; metaDescription: string | null;
  categoryName?: string; categorySlug?: string;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const product = await apiFetch<Product>(`/products/${params.slug}`, { next: { revalidate: 600 } });
    return {
      title:       product.metaTitle ?? product.name,
      description: product.metaDescription ?? product.description ?? undefined,
      openGraph: {
        title:  product.metaTitle ?? product.name,
        images: product.thumbnail ? [product.thumbnail] : [],
      },
    };
  } catch {
    return { title: 'Product Not Found' };
  }
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  let product: Product;
  try {
    
    product = await apiFetch<Product>(`/products/${params.slug}`, { next: { revalidate: 600 } });
  } catch {
    notFound();
  }

  const { currencySymbol, locale } = tenantConfig.identity;
  const { features, externalLinks, productTaxonomy } = tenantConfig;

  const hasDiscount = product.discountedPrice !== undefined && product.discountedPrice < product.price;
  const inStock     = product.stockQuantity > 0;

  // Find which attributes to display using SSOT taxonomy
  const categoryKey    = product.categorySlug ?? '';
  const taxonomyConfig = productTaxonomy.categories.find((c) => c.key === categoryKey);
  const specRows = taxonomyConfig
    ? taxonomyConfig.attributes
        .filter((attr) => product.attributes[attr.key] !== undefined)
        .map((attr) => ({
          label: attr.label,
          value: `${product.attributes[attr.key] as string}${attr.unit ? ` ${attr.unit}` : ''}`,
        }))
    : Object.entries(product.attributes).map(([k, v]) => ({ label: k, value: String(v) }));

  // External spec link (e.g. GSM Arena)
  const extLinkConfig = externalLinks[categoryKey];
  const specLink = features.externalSpecLinks && product.externalLink && extLinkConfig
    ? { url: product.externalLink, label: extLinkConfig.label }
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-24">
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
        ...(product.categoryName ? [{ label: product.categoryName, href: `/categories/${product.categorySlug}` }] : []),
        { label: product.name },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
        {/* Image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50">
          {product.thumbnail ? (
            <Image
              src={product.thumbnail} alt={product.name}
              fill className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-300">
              <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          {product.brand && <p className="text-sm text-white/50 mb-1">{product.brand}</p>}
          <h1 className="text-2xl sm:text-3xl font-bold text-white/80 mb-3">{product.name}</h1>

          {product.reviewCount > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <StarRating rating={product.averageRating} />
              <span className="text-sm text-white/70">
                {product.averageRating.toFixed(1)} ({product.reviewCount} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-4">
            {hasDiscount ? (
              <>
                <span className="text-3xl font-bold text-primary">
                  {currencySymbol}{product.discountedPrice!.toLocaleString(locale)}
                </span>
                <span className="text-xl text-white line-through">
                  {currencySymbol}{product.price.toLocaleString(locale)}
                </span>
                {product.activeDiscount?.label && (
                  <Badge variant="danger">{product.activeDiscount.label}</Badge>
                )}
              </>
            ) : (
              <span className="text-3xl font-bold text-white">
                {currencySymbol}{product.price.toLocaleString(locale)}
              </span>
            )}
          </div>

          {/* Stock */}
          <div className="mb-6">
            {inStock ? (
              <Badge variant="success">In Stock ({product.stockQuantity} available)</Badge>
            ) : (
              <Badge variant="danger">Out of Stock</Badge>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-muted leading-relaxed mb-6">{product.description}</p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mb-6">
            {features.enquiryForm && <EnquiryButton product={{ id: product.id, name: product.name }} />}
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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              {specLink.label}
            </a>
          )}
        </div>
      </div>

      {/* Specifications table */}
      {specRows.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white/80 mb-4">Specifications</h2>
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <tbody>
                {specRows.map((row, idx) => (
                  <tr key={row.label} className={idx % 2 === 0 ? 'bg-gray-600' : 'bg-gray-700'}>
                    <td className="px-4 py-3 text-white w-1/3 font-bold">{row.label}</td>
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