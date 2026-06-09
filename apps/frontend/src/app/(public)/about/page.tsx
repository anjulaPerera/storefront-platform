import { tenantConfig } from "@storefront/config";

export default function AboutPage() {
  const { pages, identity } = tenantConfig;
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-foreground mb-6">
        {pages.about.title}
      </h1>
      <div className="prose prose-gray max-w-none text-muted leading-relaxed whitespace-pre-line">
        {pages.about.body}
      </div>
      <div className="mt-10 p-6 glass rounded-2xl border border-border-mid">
        <h2 className="font-display font-semibold text-foreground mb-4">
          Contact Information
        </h2>
        <dl className="space-y-3 text-sm">
          <div className="flex gap-2">
            <dt className="font-semibold text-muted w-16 flex-shrink-0">
              Address
            </dt>
            <dd className="text-foreground">{identity.address}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold text-muted w-16 flex-shrink-0">
              Phone
            </dt>
            <dd>
              <a
                href={`tel:${identity.phone}`}
                className="text-primary hover:text-primary/80 transition-colors"
              >
                {identity.phone}
              </a>
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold text-muted w-16 flex-shrink-0">
              Email
            </dt>
            <dd>
              <a
                href={`mailto:${identity.email}`}
                className="text-primary hover:text-primary/80 transition-colors"
              >
                {identity.email}
              </a>
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold text-muted w-16 flex-shrink-0">
              Hours
            </dt>
            <dd className="text-foreground">{identity.businessHours}</dd>
          </div>
        </dl>
        {identity.mapLink && (
          <a
            href={identity.mapLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-5 text-sm text-primary hover:underline"
          >
            View on Google Maps
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
