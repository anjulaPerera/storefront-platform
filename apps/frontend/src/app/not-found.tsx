import Link from "next/link";
import { tenantConfig } from "@storefront/config";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center text-center relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(37,99,235,0.2) 0%, transparent 60%), #050816",
      }}
    >
      <div
        className="orb w-96 h-96 bg-glow-purple opacity-10 animate-float top-[-10%] right-[-10%]"
        aria-hidden="true"
      />
      <div className="relative z-10 px-4">
        <p
          className="font-display font-black text-[12rem] leading-none text-white/5 select-none"
          aria-hidden="true"
        >
          404
        </p>
        <div className="-mt-12">
          <h1 className="font-display font-black text-4xl text-white mb-4">
            Page not found
          </h1>
          <p className="text-muted max-w-sm mx-auto mb-8 leading-relaxed">
            This page drifted into deep space. Let&apos;s get you back to{" "}
            {tenantConfig.identity.shopName}.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/" className="btn-primary px-8 py-3">
              Go Home
            </Link>
            <Link href="/products" className="btn-ghost px-8 py-3">
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
