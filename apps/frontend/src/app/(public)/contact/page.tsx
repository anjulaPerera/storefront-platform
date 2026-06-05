import { tenantConfig } from "@storefront/config";
import { ContactForm } from "@/components/layout/ContactForm";

export default function ContactPage() {
  const { pages, identity } = tenantConfig;
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-foreground mb-2">
        {pages.contact.title}
      </h1>
      <p className="text-muted mb-10">{pages.contact.subtitle}</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <ContactForm />
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Find us
          </h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="font-medium text-foreground">Address</dt>
              <dd className="text-muted mt-0.5">{identity.address}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Phone</dt>
              <dd className="mt-0.5">
                <a
                  href={`tel:${identity.phone}`}
                  className="text-primary hover:underline"
                >
                  {identity.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Email</dt>
              <dd className="mt-0.5">
                <a
                  href={`mailto:${identity.email}`}
                  className="text-primary hover:underline"
                >
                  {identity.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Hours</dt>
              <dd className="text-muted mt-0.5">{identity.businessHours}</dd>
            </div>
          </dl>
          {identity.mapLink && (
            <a
              href={identity.mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 text-sm text-primary hover:underline"
            >
              View on Google Maps →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
