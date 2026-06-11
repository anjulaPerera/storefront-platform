import Link from "next/link";
import { tenantConfig } from "@storefront/config";

const { identity, navigation, social } = tenantConfig;

const SOCIAL_PATHS: Record<string, string> = {
  instagram:
    "M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M6.5 19.5h11a2 2 0 002-2v-11a2 2 0 00-2-2h-11a2 2 0 00-2 2v11a2 2 0 002 2z",
  facebook: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z",
  youtube:
    "M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.5C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z",
  whatsapp:
    "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z",
};

export function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden pt-8">
      {/* Separator — full-width gradient glow, no hard border */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="container-wide py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="font-display font-bold text-white text-sm">
                  R
                </span>
              </div>
              <span className="font-display font-bold text-xl text-white/80">
                {identity.shopName}
              </span>
            </div>
            <p className="text-muted text-sm leading-relaxed max-w-xs mb-6">
              {identity.tagline}
            </p>
            <div className="space-y-2 text-sm text-muted">
              <p>{identity.address}</p>
              <p>{identity.businessHours}</p>
              <a
                href={`tel:${identity.phone}`}
                className="block hover:text-white transition-colors"
              >
                {identity.phone}
              </a>
              <a
                href={`mailto:${identity.email}`}
                className="block hover:text-white transition-colors"
              >
                {identity.email}
              </a>
            </div>

            {/* Social */}
            <div className="flex gap-3 mt-6">
              {Object.entries(social).map(([name, url]) =>
                url && SOCIAL_PATHS[name] ? (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 glass border border-border-mid rounded-full flex items-center justify-center text-muted hover:text-white hover:border-border-bright hover:shadow-glow-sm transition-all"
                    aria-label={name}
                  >
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
                        d={SOCIAL_PATHS[name]}
                      />
                    </svg>
                  </a>
                ) : null,
              )}
            </div>
          </div>

          {/* Footer columns from SSOT */}
          {navigation.footerColumns.map((col) => (
            <div key={col.heading}>
              <h3 className="font-display font-semibold text-sm text-foreground uppercase tracking-widest mb-5">
                {col.heading}
              </h3>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="divider-gradient my-10" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-dim">
          <p>
            © {new Date().getFullYear()} {identity.shopName}. All rights
            reserved.
          </p>
          <p>Built for Sri Lanka's best mobile experience</p>
        </div>
      </div>
    </footer>
  );
}
