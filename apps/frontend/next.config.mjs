/** @type {import('next').NextConfig} */

const nextConfig = {
  transpilePackages: ["@storefront/config", "@storefront/types"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "placehold.co" },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "fdn2.gsmarena.com",
        port: "",
        pathname: "/**",
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
  },

  turbopack: {},

  async rewrites() {
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
