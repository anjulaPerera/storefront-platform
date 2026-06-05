import Link from 'next/link';
import { tenantConfig } from '@storefront/config';

const { identity, navigation, social } = tenantConfig;

function SocialIcon({ name }: { name: string }) {
  const icons: Record<string, string> = {
    facebook:  'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z',
    instagram: 'M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M6.5 19.5h11a2 2 0 002-2v-11a2 2 0 00-2-2h-11a2 2 0 00-2 2v11a2 2 0 002 2z',
    youtube:   'M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.5C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z',
    whatsapp:  'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z',
    twitter:   'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z',
  };
  const d = icons[name];
  if (!d) return null;
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand column */}
          <div className="lg:col-span-1">
            <p className="text-2xl font-bold text-white">{identity.shopName}</p>
            <p className="mt-2 text-sm text-gray-400">{identity.tagline}</p>
            <div className="mt-4 space-y-1 text-sm">
              <p>{identity.address}</p>
              <p>{identity.businessHours}</p>
              <a href={`tel:${identity.phone}`} className="hover:text-white transition-colors">
                {identity.phone}
              </a>
              <br />
              <a href={`mailto:${identity.email}`} className="hover:text-white transition-colors">
                {identity.email}
              </a>
            </div>

            {/* Social icons */}
            <div className="flex gap-3 mt-4">
              {Object.entries(social).map(([name, url]) =>
                url ? (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                    aria-label={name}
                  >
                    <SocialIcon name={name} />
                  </a>
                ) : null
              )}
            </div>
          </div>

          {/* Footer link columns from SSOT */}
          {navigation.footerColumns.map((col) => (
            <div key={col.heading}>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                {col.heading}
              </h3>
              <ul className="mt-4 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} {identity.shopName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}