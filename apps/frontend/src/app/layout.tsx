import type { Metadata } from "next";
import { Syne, Manrope } from "next/font/google";
import { tenantConfig } from "@storefront/config";
import { AppProviders } from "@/components/providers/AppProviders";
import "@/app/globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

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
    <html
      lang="en"
      className={`${syne.variable} ${manrope.variable}`}
      suppressHydrationWarning
    >

      <body className="noise-overlay">

          <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
