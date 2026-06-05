import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { tenantConfig } from "@storefront/config";
import { AppProviders } from "@/components/providers/AppProviders";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TopStrip } from "@/components/layout/TopStrip";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: tenantConfig.seo.titlePattern,
    default: tenantConfig.identity.shopName,
  },
  description: tenantConfig.seo.defaultDescription,
  metadataBase: new URL(tenantConfig.seo.canonicalBaseUrl),
  openGraph: {
    siteName: tenantConfig.identity.shopName,
    images: [tenantConfig.seo.ogImagePath],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={inter.className}
        style={{ fontFamily: tenantConfig.theme.fontFamily }}
      >
        <AppProviders>
          <TopStrip />
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
