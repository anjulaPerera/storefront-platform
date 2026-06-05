/** @type {import('next').NextConfig} */

const nextConfig = {
  transpilePackages: ["@storefront/config", "@storefront/types"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "placehold.co" },
    ],
  },

  async rewrites() {
    return process.env.NODE_ENV === "development"
      ? [
          {
            source: "/api/backend/:path*",
            // ✅ Fallback to explicit localhost string if the env variable is undefined
            destination: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/:path*`,
          },
        ]
      : [];
  },
};

export default nextConfig;
