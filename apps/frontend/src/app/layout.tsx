import type { Metadata } from "next";
import { Syne, Manrope } from "next/font/google";
import { tenantConfig } from "@storefront/config";
import { AppProviders } from "@/components/providers/AppProviders";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TopStrip } from "@/components/layout/TopStrip";
import { ChatWidget } from "@/components/ai/ChatWidget";
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
        <AppProviders>
          <TopStrip />
          <Navbar />
          <main>{children}</main>
          <Footer />
          <ChatWidget />
        </AppProviders>
      </body>
    </html>
  );
}
