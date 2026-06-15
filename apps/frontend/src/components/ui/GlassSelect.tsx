// components/ui/GlassSelect.tsx
"use client";

import { useState, useRef, useEffect } from "react";

interface Option {
  value: string;
  label: string;
}

interface GlassSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  "aria-label"?: string;
  className?: string;
}

export function GlassSelect({
  value,
  onChange,
  options,
  "aria-label": ariaLabel,
  className = "",
}: GlassSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`} aria-label={ariaLabel}>
      {/* Trigger Button: Uses system fields but forces background-image to none */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="admin-field w-full flex items-center justify-between gap-3 text-left cursor-pointer !bg-none !pr-3 !h-9"
      >
        <span>{selected?.label ?? "Select…"}</span>
        <svg
          className={`w-3.5 h-3.5 text-white/50 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Options Surface */}
      {open && (
        <div
          className="absolute z-50 mt-2 w-full min-w-[160px] rounded-2xl overflow-hidden
          border border-white/10
          bg-[#0B1220]/95 backdrop-blur-2xl
          shadow-[0_8px_40px_rgba(0,0,0,0.6)]
          animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <div className="py-1.5">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer
                  ${
                    value === opt.value
                      ? "text-white bg-white/10 font-medium"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
