"use client";

import { useState, useEffect } from "react";
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
  showCategories?: boolean; // New prop
}

export function FilterSidebar({
  categories,
  brands,
  showCategories = true,
}: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");

  useEffect(() => {
    setMinPrice(searchParams.get("minPrice") ?? "");
    setMaxPrice(searchParams.get("maxPrice") ?? "");
  }, [searchParams]);

  const currentCategory = searchParams.get("categorySlug") ?? "";
  const currentBrand = searchParams.get("brand") ?? "";
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

  function applyPriceFilter() {
    const params = new URLSearchParams(searchParams.toString());
    if (minPrice) params.set("minPrice", minPrice);
    else params.delete("minPrice");

    if (maxPrice) params.set("maxPrice", maxPrice);
    else params.delete("maxPrice");

    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearAll() {
    router.push(pathname);
  }

  const hasFilters = !!(
    currentCategory ||
    currentBrand ||
    searchParams.has("minPrice") ||
    searchParams.has("maxPrice")
  );

  return (
    <aside className="space-y-6">
      {hasFilters && (
        <button
          onClick={clearAll}
          className="text-xs text-accent hover:text-accent/80 transition-colors font-semibold uppercase tracking-widest flex items-center gap-1.5"
        >
          Clear all filters
        </button>
      )}

      <div>
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">
          Sort By
        </h3>
        <select
          value={currentSort}
          onChange={(e) => updateFilter("sort", e.target.value)}
          aria-label="Sort products by price or date"
          className="w-full input-dark text-sm cursor-pointer"
        >
          <option value="newest">Newest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name_asc">Name: A–Z</option>
        </select>
      </div>

      {/* Conditionally rendered Categories */}
      {showCategories && categories.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">
            Category
          </h3>
          <ul className="space-y-0.5">
            <li>
              <button
                onClick={() => updateFilter("categorySlug", "")}
                className={`w-full text-left text-sm px-3 py-2 rounded-lg ${!currentCategory ? "text-white bg-primary/20" : "text-white/50"}`}
              >
                All Categories
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() => updateFilter("categorySlug", cat.slug)}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg ${currentCategory === cat.slug ? "text-white bg-primary/20" : "text-white/50"}`}
                >
                  {cat.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

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
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/5"
                >
                  <input
                    type="checkbox"
                    id={id}
                    checked={checked}
                    onChange={() => updateFilter("brand", checked ? "" : brand)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary accent-primary cursor-pointer"
                  />
                  <span
                    className={`text-sm ${checked ? "text-white font-medium" : "text-white/60"}`}
                  >
                    {brand}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">
          Price ({tenantConfig.identity.currencySymbol})
        </h3>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="input-dark text-sm w-full"
            />
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="input-dark text-sm w-full"
            />
          </div>
          <button
            onClick={applyPriceFilter}
            className="w-full bg-primary/20 hover:bg-primary/30 text-white text-sm py-2 rounded-lg transition-colors"
          >
            Apply Price Filter
          </button>
        </div>
      </div>
    </aside>
  );
}
