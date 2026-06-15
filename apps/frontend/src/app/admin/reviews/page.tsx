"use client";

import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { AdminTable } from "@/components/admin/AdminTable";
import { StarRating } from "@/components/ui/StarRating";
import { Badge } from "@/components/ui/Badge";
import { useAdminData } from "@/hooks/useAdminData";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  isApproved: boolean;
  createdAt: string;
  userFirstName?: string;
  userLastName?: string;
}

export default function AdminReviewsPage() {
  const { accessToken } = useAuthStore();

  const {
    data: reviews = [],
    loading,
    reload,
  } = useAdminData(
    (token) => api.admin.listPendingReviews(token) as Promise<Review[]>,
    accessToken,
  );

  async function approve(id: string) {
    if (!accessToken) return;
    await api.admin.approveReview(id, accessToken).catch(() => {});
    await reload();
  }

  async function remove(id: string) {
    if (!accessToken || !confirm("Delete this review?")) return;
    await api.admin.deleteReview(id, accessToken).catch(() => {});
    await reload();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Pending Reviews</h1>
        <Badge variant={reviews.length > 0 ? "warning" : "success"}>
          {reviews.length} pending
        </Badge>
      </div>
      {loading ? (
        <div className="text-center py-12 text-muted">Loading…</div>
      ) : (
        <AdminTable
          rows={reviews}
          keyFn={(r) => r.id}
          empty="No pending reviews — great job! ✓"
          columns={[
            {
              label: "Rating",
              render: (r) => <StarRating rating={r.rating} size="sm" />,
              width: "w-32",
            },
            {
              label: "Review",
              render: (r) => (
                <div>
                  {r.title && (
                    <p className="font-medium text-sm text-foreground">
                      {r.title}
                    </p>
                  )}
                  {r.body && (
                    <p className="text-xs text-muted line-clamp-2 mt-0.5">
                      {r.body}
                    </p>
                  )}
                </div>
              ),
            },
            {
              label: "By",
              render: (r) => (
                <span className="text-sm text-muted">
                  {r.userFirstName} {r.userLastName}
                </span>
              ),
              width: "w-32",
            },
            {
              label: "Date",
              render: (r) => new Date(r.createdAt).toLocaleDateString(),
              width: "w-28",
            },
            {
              label: "Actions",
              width: "w-36",
              render: (r) => (
                <div className="flex gap-2">
                  <button
                    onClick={() => approve(r.id)}
                    className="text-xs text-green-600 border border-green-200 px-2 py-1 rounded hover:bg-green-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => remove(r.id)}
                    className="text-xs text-red-500 border border-red-200 px-2 py-1 rounded hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
