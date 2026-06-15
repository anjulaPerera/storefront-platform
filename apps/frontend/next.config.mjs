/** @type {import('next').NextConfig} */

const nextConfig = {
  transpilePackages: ["@storefront/config", "@storefront/types"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "res.cloudinary.com" },
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

  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      // Ensure node bindings never get bundled.
      "onnxruntime-node$": false,
    };

    // Prevent Next/Webpack from parsing onnxruntime-web's WebGPU ESM bundle at build time.
    // The AI feature is client-only ("use client"), so it will be loaded in the browser.
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // These paths are where the problematic `ort.webgpu.bundle.min.mjs` lives.
        "onnxruntime-web/webgpu/.*$": false,
      };
    }

    return config;
  },

  async rewrites() {
    const backendOrigin = (() => {
      const raw =
        process.env.BACKEND_URL ??
        process.env.NEXT_PUBLIC_API_URL ??
        "http://127.0.0.1:4000";
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
