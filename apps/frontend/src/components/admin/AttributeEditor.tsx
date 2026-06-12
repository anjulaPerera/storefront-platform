"use client";

import { useState } from "react";
import { tenantConfig } from "@storefront/config";

interface AttributeEditorProps {
  categoryKey: string;
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
  /** Parent supplies this; it owns the auth token */
  onAIFill?: () => Promise<Record<string, string> | null>;
}

export function AttributeEditor({
  categoryKey,
  values,
  onChange,
  onAIFill,
}: AttributeEditorProps) {
  const [filling, setFilling] = useState(false);
  const [fillError, setFillError] = useState<string | null>(null);

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

  async function handleAIFill() {
    if (!onAIFill) return;
    if (!categoryConfig) return;
    setFilling(true);
    setFillError(null);

    try {
      const aiAttrs = await onAIFill();

      if (!aiAttrs || Object.keys(aiAttrs).length === 0) {
        setFillError(
          "AI returned no attributes — try a more specific product name.",
        );
        return;
      }

      // Merge AI values; only overwrite fields that are currently empty
      const merged: Record<string, unknown> = { ...values };
      for (const attr of categoryConfig.attributes) {
        const aiVal = aiAttrs[attr.key];
        if (aiVal && !merged[attr.key]) {
          if (attr.type === "select" && attr.options) {
            // Only apply if the value matches one of the valid options
            const match = attr.options.find(
              (o) => o.toLowerCase() === aiVal.toLowerCase(),
            );
            if (match) merged[attr.key] = match;
          } else {
            merged[attr.key] = aiVal;
          }
        }
      }

      onChange(merged);
    } catch (err) {
      setFillError(err instanceof Error ? err.message : "AI fill failed.");
    } finally {
      setFilling(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm " +
    "text-slate-100 placeholder-slate-500 " +
    "focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 " +
    "disabled:opacity-50";

  return (
    <div className="space-y-4">
      {/* AI fill bar — only shown when parent provides the callback */}
      {onAIFill && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAIFill}
            disabled={filling}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium
                       text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed
                       transition-colors"
          >
            {filling ? (
              <>
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Filling…
              </>
            ) : (
              <>
                <span>✨</span>
                Auto-fill specs with AI
              </>
            )}
          </button>
          <span className="text-xs text-slate-500">
            Pre-fills empty fields — you can edit after.
          </span>
        </div>
      )}

      {fillError && (
        <p className="rounded-lg bg-red-900/40 border border-red-700 px-3 py-2 text-xs text-red-300">
          {fillError}
        </p>
      )}

      {/* Attribute fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {categoryConfig.attributes.map((attr) => {
          const fieldId = `attr-${attr.key}`;
          const val = String(values[attr.key] ?? "");

          return (
            <div key={attr.key}>
              <label
                htmlFor={fieldId}
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                {attr.label}
                {attr.unit ? (
                  <span className="ml-1 text-xs text-slate-500">
                    ({attr.unit})
                  </span>
                ) : null}
              </label>

              {attr.type === "select" && attr.options ? (
                <select
                  id={fieldId}
                  value={val}
                  onChange={(e) => set(attr.key, e.target.value)}
                  className={inputCls}
                >
                  <option value="" className="bg-slate-900 text-slate-400">
                    Select…
                  </option>
                  {attr.options.map((opt) => (
                    <option
                      key={opt}
                      value={opt}
                      className="bg-slate-900 text-slate-100"
                    >
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
                  className={inputCls}
                  placeholder={
                    attr.unit ? `e.g. 5000 ${attr.unit}` : attr.label
                  }
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
