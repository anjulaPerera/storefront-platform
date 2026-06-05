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
      <div className="mt-10 p-6 bg-gray-50 rounded-xl">
        <h2 className="font-semibold text-foreground mb-3">
          Contact Information
        </h2>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="font-medium text-foreground inline">Address: </dt>
            <dd className="inline text-muted">{identity.address}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground inline">Phone: </dt>
            <dd className="inline">
              <a
                href={`tel:${identity.phone}`}
                className="text-primary hover:underline"
              >
                {identity.phone}
              </a>
            </dd>
          </div>
          <div>
            <dt className="font-medium text-foreground inline">Email: </dt>
            <dd className="inline">
              <a
                href={`mailto:${identity.email}`}
                className="text-primary hover:underline"
              >
                {identity.email}
              </a>
            </dd>
          </div>
          <div>
            <dt className="font-medium text-foreground inline">Hours: </dt>
            <dd className="inline text-muted">{identity.businessHours}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
