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
    params.delete("page");
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
          className="text-xs text-accent hover:text-accent/80 transition-colors font-semibold uppercase tracking-widest flex items-center gap-1.5"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Clear all filters
        </button>
      )}

      {/* Sort */}
      <div>
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">
          Sort By
        </h3>
        <select
          value={currentSort}
          onChange={(e) => updateFilter("sort", e.target.value)}
          aria-label="Sort products"
          className="w-full input-dark text-sm cursor-pointer"
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
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">
            Category
          </h3>
          <ul className="space-y-0.5">
            <li>
              <button
                onClick={() => updateFilter("categorySlug", "")}
                className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                  !currentCategory
                    ? "text-white bg-primary/20 font-semibold"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                All Categories
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() => updateFilter("categorySlug", cat.slug)}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    currentCategory === cat.slug
                      ? "text-white bg-primary/20 font-semibold"
                      : "text-white/50 hover:text-white hover:bg-white/5"
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
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">
            Brand
          </h3>
          <div className="space-y-1.5">
            {brands.map((brand) => {
              const id = `brand-${brand}`;
              const checked = currentBrand === brand;
              return (
                <label
                  key={brand}
                  htmlFor={id}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    checked ? "bg-primary/15" : "hover:bg-white/5"
                  }`}
                >
                  <input
                    type="checkbox"
                    id={id}
                    checked={checked}
                    onChange={() => updateFilter("brand", checked ? "" : brand)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary accent-primary cursor-pointer"
                  />
                  <span
                    className={`text-sm transition-colors ${checked ? "text-white font-medium" : "text-white/60"}`}
                  >
                    {brand}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Price range */}
      <div>
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">
          Price ({tenantConfig.identity.currencySymbol})
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={currentMinPrice}
            onChange={(e) => updateFilter("minPrice", e.target.value)}
            min={0}
            aria-label="Minimum price"
            className="input-dark text-sm w-full"
          />
          <span className="text-white/30 text-sm flex-shrink-0">–</span>
          <input
            type="number"
            placeholder="Max"
            value={currentMaxPrice}
            onChange={(e) => updateFilter("maxPrice", e.target.value)}
            min={0}
            aria-label="Maximum price"
            className="input-dark text-sm w-full"
          />
        </div>
      </div>
    </aside>
  );
}
