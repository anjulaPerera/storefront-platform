/** @type {import('next').NextConfig} */

const nextConfig = {
  transpilePackages: ["@storefront/config", "@storefront/types"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
  // Forward API calls to backend during dev (optional, can use NEXT_PUBLIC_API_URL directly)
  // Forward API calls to backend during dev
  async rewrites() {
    // ✅ Extract variable with a fallback to prevent "undefined" string compilation errors
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    return process.env.NODE_ENV === "development"
      ? [
          {
            source: "/api/backend/:path*",
            destination: `${backendUrl}/:path*`,
          },
        ]
      : [];
  },
};

export default nextConfig;
