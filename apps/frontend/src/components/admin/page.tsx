"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";

interface Stats {
  totalProducts: number;
  pendingReviews: number;
  openEnquiries: number;
  activeDiscounts: number;
  totalUsers: number;
}

const STAT_CARDS = [
  {
    key: "totalProducts",
    label: "Active Products",
    href: "/admin/products",
    color: "bg-blue-50 text-blue-700",
    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  },
  {
    key: "pendingReviews",
    label: "Pending Reviews",
    href: "/admin/reviews",
    color: "bg-yellow-50 text-yellow-700",
    icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
  },
  {
    key: "openEnquiries",
    label: "Open Enquiries",
    href: "/admin/enquiries",
    color: "bg-red-50 text-red-700",
    icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
  },
  {
    key: "activeDiscounts",
    label: "Active Discounts",
    href: "/admin/discounts",
    color: "bg-green-50 text-green-700",
    icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
  },
  {
    key: "totalUsers",
    label: "Total Users",
    href: "/admin/users",
    color: "bg-purple-50 text-purple-700",
    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  },
];

export default function AdminDashboard() {
  const { accessToken } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    api.admin
      .stats(accessToken)
      .then((data) => setStats(data as Stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {STAT_CARDS.map(({ key, label, href, color, icon }) => (
          <Link
            key={key}
            href={href}
            className="bg-surface rounded-xl border border-gray-100 p-5 hover:border-primary/30 hover:shadow-sm transition-all group"
          >
            <div className={`inline-flex p-2 rounded-lg ${color} mb-3`}>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={icon}
                />
              </svg>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {loading
                ? "—"
                : (stats?.[key as keyof Stats] ?? 0).toLocaleString()}
            </p>
            <p className="text-sm text-muted mt-1 group-hover:text-primary transition-colors">
              {label}
            </p>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div className="bg-surface rounded-xl border border-gray-100 p-6">
        <h2 className="font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/products?action=new"
            className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition-colors"
          >
            + Add Product
          </Link>
          <Link
            href="/admin/banners?action=new"
            className="px-4 py-2 bg-surface border border-gray-200 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            + New Banner
          </Link>
          <Link
            href="/admin/discounts?action=new"
            className="px-4 py-2 bg-surface border border-gray-200 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            + New Discount
          </Link>
          <Link
            href="/admin/reviews"
            className="px-4 py-2 bg-surface border border-gray-200 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            Moderate Reviews
          </Link>
        </div>
      </div>
    </div>
  );
}
