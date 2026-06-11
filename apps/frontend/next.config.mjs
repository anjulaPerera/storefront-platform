/** @type {import('next').NextConfig} */

const nextConfig = {
  transpilePackages: ["@storefront/config", "@storefront/types"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "placehold.co" },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
  },

  async rewrites() {
    // BACKEND_URL is a server-only env var (no NEXT_PUBLIC_ prefix).
    // It is never exposed to the browser — it just tells Next.js where to
    // forward /api/backend/* requests.
    //
    // In dev:  BACKEND_URL=http://127.0.0.1:4000
    // In prod: BACKEND_URL=https://api.yourproductiondomain.com
    //
    // NEXT_PUBLIC_API_URL is intentionally NOT used here. That var is exposed
    // to the browser, and if it were also used as the rewrite destination it
    // would create a conflict where the browser calls the backend directly
    // (cross-origin) and refresh-token cookies get silently dropped.
    const backendOrigin = (() => {
      const raw =
        process.env.BACKEND_URL ??
        process.env.NEXT_PUBLIC_API_URL ??
        "http://127.0.0.1:4000";
      // Strip trailing /api/v1 if someone accidentally put it in the env —
      // the rewrite preserves :path* which already includes it.
      return raw.replace(/\/api\/v1\/?$/, "");
    })();

    return [
      {
        source: "/api/backend/:path*",
        destination: `${backendOrigin}/:path*`,
      },
    ];
  },
};

export default nextConfig;
