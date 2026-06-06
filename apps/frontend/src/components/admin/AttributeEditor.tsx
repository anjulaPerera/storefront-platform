"use client";

import { tenantConfig } from "@storefront/config";

interface AttributeEditorProps {
  categoryKey: string;
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
}

export function AttributeEditor({
  categoryKey,
  values,
  onChange,
}: AttributeEditorProps) {
  const categoryConfig = tenantConfig.productTaxonomy.categories.find(
    (c) => c.key === categoryKey,
  );
  if (!categoryConfig) {
    return (
      <p className="text-sm text-muted">
        Select a category to see attribute fields.
      </p>
    );
  }

  function set(key: string, value: unknown) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {categoryConfig.attributes.map((attr) => {
        const fieldId = `attr-${attr.key}`;
        const val = String(values[attr.key] ?? "");

        return (
          <div key={attr.key}>
            <label
              htmlFor={fieldId}
              className="block text-sm font-medium text-foreground mb-1"
            >
              {attr.label}
              {attr.unit ? ` (${attr.unit})` : ""}
            </label>

            {attr.type === "select" && attr.options ? (
              <select
                id={fieldId}
                value={val}
                onChange={(e) => set(attr.key, e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-surface"
              >
                <option value="">Select…</option>
                {attr.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                    {attr.unit ? ` ${attr.unit}` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={fieldId}
                type={attr.type === "number" ? "number" : "text"}
                value={val}
                onChange={(e) => set(attr.key, e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={attr.label}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
