"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { tenantConfig } from "@storefront/config";

interface Category {
  id: string;
  name: string;
  slug: string;
  children?: Category[];
}

interface FilterSidebarProps {
  categories: Category[];
  brands: string[];
}

export function FilterSidebar({ categories, brands }: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("categorySlug") ?? "";
  const currentBrand = searchParams.get("brand") ?? "";
  const currentMinPrice = searchParams.get("minPrice") ?? "";
  const currentMaxPrice = searchParams.get("maxPrice") ?? "";
  const currentSort = searchParams.get("sort") ?? "newest";

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // Reset to page 1 on filter change
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearAll() {
    router.push(pathname);
  }

  const hasFilters =
    currentCategory || currentBrand || currentMinPrice || currentMaxPrice;

  return (
    <aside className="space-y-6">
      {hasFilters && (
        <button
          onClick={clearAll}
          className="text-sm text-primary hover:underline"
        >
          Clear all filters
        </button>
      )}

      {/* Sort */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Sort By</h3>
        <select
          id="sort-select"
          value={currentSort}
          onChange={(e) => updateFilter("sort", e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-surface"
          aria-label="Sort products"
        >
          <option value="newest">Newest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name_asc">Name: A–Z</option>
        </select>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Category
          </h3>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => updateFilter("categorySlug", "")}
                className={`text-sm w-full text-left px-2 py-1 rounded transition-colors ${
                  !currentCategory
                    ? "text-primary font-medium"
                    : "text-muted hover:text-foreground"
                }`}
              >
                All Categories
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() => updateFilter("categorySlug", cat.slug)}
                  className={`text-sm w-full text-left px-2 py-1 rounded transition-colors ${
                    currentCategory === cat.slug
                      ? "text-primary font-medium"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {cat.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Brands */}
      {brands.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Brand</h3>
          <div className="space-y-2">
            {brands.map((brand) => {
              const id = `brand-${brand}`;
              return (
                <div key={brand} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={id}
                    checked={currentBrand === brand}
                    onChange={() =>
                      updateFilter("brand", currentBrand === brand ? "" : brand)
                    }
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label
                    htmlFor={id}
                    className="text-sm text-foreground cursor-pointer"
                  >
                    {brand}
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Price range */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Price ({tenantConfig.identity.currencySymbol})
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            id="min-price"
            placeholder="Min"
            value={currentMinPrice}
            onChange={(e) => updateFilter("minPrice", e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            min={0}
            aria-label="Minimum price"
          />
          <span className="text-muted text-sm">–</span>
          <input
            type="number"
            id="max-price"
            placeholder="Max"
            value={currentMaxPrice}
            onChange={(e) => updateFilter("maxPrice", e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            min={0}
            aria-label="Maximum price"
          />
        </div>
      </div>
    </aside>
  );
}
