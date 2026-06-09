import Link from "next/link";
import { tenantConfig } from "@storefront/config";
import { apiFetch } from "@/lib/api";
import { ProductGrid } from "@/components/product/ProductGrid";
import { FadeIn } from "@/components/motion/FadeIn";
import { ChatTriggerButton } from "@/components/ai/ChatTriggerButton";

export const dynamic = "force-dynamic";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  thumbnail: string | null;
  brand: string | null;
  stockQuantity: number;
  averageRating: number;
  reviewCount: number;
  activeDiscount?: { label: string | null };
  discountedPrice?: number;
}
interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

async function getData() {
  const [featured, categories] = await Promise.allSettled([
    apiFetch<Product[]>("/products/featured?limit=8", { cache: "no-store" }),
    apiFetch<Category[]>("/categories", { cache: "no-store" }),
  ]);
  return {
    featured: featured.status === "fulfilled" ? featured.value : [],
    categories: categories.status === "fulfilled" ? categories.value : [],
  };
}

const BRANDS = [
  "Samsung",
  "Apple",
  "Xiaomi",
  "OPPO",
  "Vivo",
  "OnePlus",
  "Realme",
  "Huawei",
  "Nothing",
  "Google",
];

// Deterministic star positions (SSR-safe)
const STARS = Array.from({ length: 120 }, (_, i) => ({
  top: (i * 37 + 11) % 100,
  left: (i * 53 + 23) % 100,
  size: ((i * 7) % 2) + 1,
  opacity: ((i * 11) % 60) / 100 + 0.15,
  delay: ((i * 3) % 30) / 10,
  duration: ((i * 13) % 20) / 10 + 2.5,
}));

const CATEGORY_META: Record<
  string,
  { gradient: string; emoji: string; description: string }
> = {
  smartphones: {
    gradient: "from-blue-900/60 via-blue-800/30 to-transparent",
    emoji: "📱",
    description: "Latest flagships & mid-range gems",
  },
  tablets: {
    gradient: "from-violet-900/60 via-violet-800/30 to-transparent",
    emoji: "⊡",
    description: "Work, create & entertain",
  },
  accessories: {
    gradient: "from-amber-900/60 via-amber-800/30 to-transparent",
    emoji: "🔋",
    description: "Cases, cables, chargers & more",
  },
};

export default async function HomePage() {
  const { featured, categories } = await getData();
  const { pages, identity, ai } = tenantConfig;

  return (
    <div className="overflow-x-hidden">
      {/* ──────────────────────────────────────────────────────
          HERO
      ────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex flex-col items-center text-center overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% -5%, rgba(37,99,235,0.4) 0%, transparent 65%), radial-gradient(ellipse 60% 50% at 80% 90%, rgba(124,58,237,0.25) 0%, transparent 55%), #050816",
        }}
      >
        {/* Starfield */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
        >
          {STARS.map((s, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white animate-twinkle"
              style={{
                top: `${s.top}%`,
                left: `${s.left}%`,
                width: `${s.size}px`,
                height: `${s.size}px`,
                opacity: s.opacity,
                animationDelay: `${s.delay}s`,
                animationDuration: `${s.duration}s`,
              }}
            />
          ))}
        </div>

        {/* Floating orbs */}
        <div
          className="orb w-[600px] h-[600px] bg-glow-blue opacity-20 animate-float-slow top-[-15%] left-[-10%]"
          aria-hidden="true"
        />
        <div
          className="orb w-[400px] h-[400px] bg-glow-purple opacity-15 animate-float bottom-[5%] right-[-5%]"
          aria-hidden="true"
        />
        <div
          className="orb w-[300px] h-[300px] bg-glow-amber opacity-10 animate-float-fast bottom-[30%] left-[10%]"
          aria-hidden="true"
        />

        {/* Content */}
        <div className="relative z-10 container-wide pt-36 pb-24 flex flex-col items-center justify-center flex-1">
          {/* Eyebrow */}
          <div
            className="animate-fade-in"
            style={{ animationDelay: "0.1s", animationFillMode: "both" }}
          >
            <span className="badge-amber mb-8 inline-flex">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-glow-pulse" />
              Sri Lanka&apos;s Premium Mobile Destination
            </span>
          </div>

          {/* Headline */}
          <h1
            className="font-display font-black tracking-tighter leading-[0.92] mb-8 animate-fade-up"
            style={{ animationFillMode: "both", animationDelay: "0.2s" }}
          >
            <span className="block text-hero text-white">Find Your</span>
            <span className="block text-hero-lg text-gradient">
              Perfect Phone.
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-muted text-lg max-w-xl mx-auto mb-12 leading-relaxed animate-fade-up"
            style={{ animationFillMode: "both", animationDelay: "0.4s" }}
          >
            {pages.homepage.heroSubtitle}
          </p>

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up"
            style={{ animationFillMode: "both", animationDelay: "0.55s" }}
          >
            <Link
              href={pages.homepage.heroCTALink}
              className="btn-primary text-base px-8 py-3.5"
            >
              {pages.homepage.heroCTAText}
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
            {ai.enabled && (
              <Link
                href="#ai-advisor"
                className="btn-ghost text-base px-8 py-3.5"
              >
                <svg
                  className="w-4 h-4 text-accent"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                </svg>
                Ask AI Advisor
              </Link>
            )}
          </div>

          {/* Trust stats */}
          <div
            className="flex flex-wrap items-center justify-center gap-8 mt-16 animate-fade-up"
            style={{ animationFillMode: "both", animationDelay: "0.7s" }}
          >
            {[
              { value: "5,000+", label: "Products" },
              { value: "100%", label: "Genuine" },
              { value: "3+ Yrs", label: "Trusted" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-display font-bold text-2xl text-white">
                  {stat.value}
                </p>
                <p className="text-xs text-muted uppercase tracking-widest mt-0.5">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-space-1 to-transparent pointer-events-none" />

        {/* Scroll hint */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-40"
          aria-hidden="true"
        >
          <p className="text-xs text-muted tracking-widest uppercase">Scroll</p>
          <svg
            className="w-4 h-4 text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────
          BRANDS MARQUEE
      ────────────────────────────────────────────────────── */}
      <section className="py-10 border-y border-border overflow-hidden relative">
        {/* Fade left edge */}
        <div
          className="absolute left-0 inset-y-0 w-24 z-10 pointer-events-none"
          style={{
            background: "linear-gradient(to right, var(--bg), transparent)",
          }}
          aria-hidden="true"
        />
        {/* Fade right edge */}
        <div
          className="absolute right-0 inset-y-0 w-24 z-10 pointer-events-none"
          style={{
            background: "linear-gradient(to left, var(--bg), transparent)",
          }}
          aria-hidden="true"
        />

        <div
          className="marquee-track"
          aria-label="Brands we carry"
          aria-hidden="true"
        >
          {[...BRANDS, ...BRANDS].map((brand, i) => (
            <span
              key={i}
              className="font-display font-bold text-base uppercase tracking-[0.15em] text-white/20 hover:text-white/60 transition-colors duration-300 cursor-default flex-shrink-0"
            >
              {brand}
            </span>
          ))}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────
          CATEGORIES
      ────────────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="section-padding">
          <div className="container-wide">
            <FadeIn className="mb-12">
              <p className="badge-amber mb-4">Categories</p>
              <h2 className="font-display font-black text-display text-white">
                {pages.homepage.categorySectionTitle}
              </h2>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {categories.slice(0, 3).map((cat, i) => {
                const meta = CATEGORY_META[cat.slug] ?? {
                  gradient: "from-gray-900/60 via-gray-800/30 to-transparent",
                  emoji: "🛍️",
                  description: cat.description ?? "",
                };
                return (
                  <FadeIn key={cat.id} delay={(i + 1) as 1 | 2 | 3}>
                    <Link
                      href={`/categories/${cat.slug}`}
                      className="group relative block overflow-hidden rounded-3xl border border-border hover:border-border-bright transition-all duration-500 aspect-[4/3]"
                      style={{
                        background: "linear-gradient(135deg, #0D111F, #080d1f)",
                      }}
                    >
                      {/* Gradient overlay */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${meta.gradient} transition-opacity duration-500 group-hover:opacity-80`}
                      />

                      {/* Content */}
                      <div className="absolute inset-0 p-8 flex flex-col justify-end">
                        <span className="text-4xl mb-3">{meta.emoji}</span>
                        <h3 className="font-display font-bold text-2xl text-white mb-1">
                          {cat.name}
                        </h3>
                        <p className="text-sm text-muted mb-4">
                          {meta.description}
                        </p>
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 group-hover:text-white group-hover:gap-3 transition-all">
                          Explore
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </span>
                      </div>

                      {/* Corner glow on hover */}
                      <div
                        className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{
                          background:
                            "radial-gradient(circle at top right, rgba(37,99,235,0.25), transparent 70%)",
                        }}
                      />
                    </Link>
                  </FadeIn>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ──────────────────────────────────────────────────────
          FEATURED PRODUCTS
      ────────────────────────────────────────────────────── */}
      <section className="section-padding bg-space-2/50">
        <div className="container-wide">
          <FadeIn className="flex items-end justify-between mb-12 flex-wrap gap-4">
            <div>
              <p className="badge-amber mb-4">Featured</p>
              <h2 className="font-display font-black text-display text-white">
                {pages.homepage.featuredSectionTitle}
              </h2>
            </div>
            <Link href="/products" className="btn-ghost text-sm px-5 py-2.5">
              View All
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </FadeIn>

          {featured.length > 0 ? (
            <FadeIn variant="scale">
              <ProductGrid products={featured} columns={4} />
            </FadeIn>
          ) : (
            <FadeIn>
              <div className="text-center py-20 glass rounded-3xl border border-border">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-primary/50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="font-display font-bold text-xl text-white mb-2">
                  Products Coming Soon
                </h3>
                <p className="text-muted text-sm">
                  Our collection is being curated. Check back shortly.
                </p>
              </div>
            </FadeIn>
          )}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────
          AI ADVISOR SPOTLIGHT
      ────────────────────────────────────────────────────── */}
      {ai.enabled && (
        <section id="ai-advisor" className="section-padding">
          <div className="container-wide">
            <FadeIn>
              <div className="relative overflow-hidden rounded-3xl border border-primary/20 p-1">
                <div
                  className="relative rounded-[1.4rem] overflow-hidden px-8 py-16 text-center"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(124,58,237,0.08) 50%, rgba(245,158,11,0.06) 100%), #0D111F",
                  }}
                >
                  {/* Orbs inside */}
                  <div
                    className="orb w-80 h-80 bg-glow-blue opacity-20 animate-float top-[-30%] left-[-10%]"
                    aria-hidden="true"
                  />
                  <div
                    className="orb w-60 h-60 bg-glow-purple opacity-15 animate-float-slow bottom-[-20%] right-[-5%]"
                    aria-hidden="true"
                  />

                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-6">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      Powered by Gemini AI
                    </div>
                    <h2 className="font-display font-black text-hero-sm text-white mb-4">
                      Meet{" "}
                      <span className="text-gradient">{ai.assistantName}</span>,
                      <br />
                      your phone expert.
                    </h2>
                    <p className="text-muted max-w-lg mx-auto mb-8 leading-relaxed">
                      Not sure which phone to get? Ask Ranga. Get instant
                      recommendations, spec comparisons, and expert advice —
                      available 24/7.
                    </p>

                    {/* Chat preview */}
                    <div className="max-w-md mx-auto glass-2 rounded-2xl border border-border-mid p-4 text-left mb-8">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                          R
                        </div>
                        <div className="flex-1 bg-space-3 rounded-xl rounded-tl-none px-3 py-2.5 text-sm text-foreground/90 leading-relaxed">
                          {ai.greetingMessage}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted/60 mb-4">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                      </svg>
                      Click the chat button at the bottom-right to start
                    </div>

                    {/* RENDER THE REFACTORED INTERACTIVE BUTTON HERE */}
                    <ChatTriggerButton />

                    <p className="text-xs text-muted/50 mt-3">
                      Available 24/7 · Powered by Gemini AI
                    </p>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>
      )}

      {/* ──────────────────────────────────────────────────────
          WHY RANGAPHONES
      ────────────────────────────────────────────────────── */}
      <section className="section-padding border-t border-border">
        <div className="container-wide">
          <FadeIn className="text-center mb-16">
            <h2 className="font-display font-black text-display text-white">
              Why choose us?
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: "🛡️",
                title: "Official Warranty",
                desc: "Every product comes with manufacturer warranty. No grey market, no surprises.",
              },
              {
                icon: "⚡",
                title: "Fastest Delivery",
                desc: "Colombo same-day delivery. Island-wide next day. Get your phone when you need it.",
              },
              {
                icon: "🤖",
                title: "AI Expert Support",
                desc: "Our AI advisor helps you choose the right phone 24/7, instantly.",
              },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={(i + 1) as 1 | 2 | 3}>
                <div className="card-cinematic p-6">
                  <div className="text-3xl mb-4">{item.icon}</div>
                  <h3 className="font-display font-bold text-lg text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
