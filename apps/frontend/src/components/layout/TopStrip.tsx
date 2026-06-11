import { apiFetch } from "@/lib/api";

interface Banner {
  id: string;
  content: string;
  linkUrl: string | null;
  linkText: string | null;
}

async function getBanners(): Promise<Banner[]> {
  try {
    return await apiFetch<Banner[]>("/banners?type=top_strip", {
      next: { revalidate: 60 },
    });
  } catch {
    return [];
  }
}

export async function TopStrip() {
  const banners = await getBanners();
  if (banners.length === 0) return null;
  const banner = banners[0];

  return (
    <div
      className="relative z-50 w-full py-2 px-4 text-center text-xs font-semibold tracking-wide"
      style={{
        background: "linear-gradient(90deg, #1D4ED8, #7C3AED, #1D4ED8)",
        backgroundSize: "200% 100%",
        animation: "shimmer 4s linear infinite",
      }}
    >
      <style>{`@keyframes shimmer { 0%{background-position:0%} 100%{background-position:200%} }`}</style>
      <span
        className="text-white/90"
        dangerouslySetInnerHTML={{ __html: banner.content }}
      />
      {banner.linkUrl && (
        <a
          href={banner.linkUrl}
          className="ml-2 text-white font-bold underline underline-offset-2 hover:no-underline"
        >
          {banner.linkText ?? "Learn more"} →
        </a>
      )}
    </div>
  );
}
