export type BusinessType =
  | "MOBILE_SHOP"
  | "COMPUTER_SHOP"
  | "GIFT_SHOP"
  | "ELECTRONICS"
  | "CUSTOM";

export type ExperienceStyle =
  | "minimal"
  | "modern"
  | "cinematic"
  | "luxury"
  | "tech";
export type ThemeMode = "light" | "dark";
export type MotionLevel = "none" | "subtle" | "medium" | "immersive";

export interface TenantConfig {
  businessType: BusinessType;
  experience: ExperienceConfig;
  identity: IdentityConfig;
  theme: ThemeConfig;
  navigation: NavigationConfig;
  features: FeatureFlags;
  productTaxonomy: ProductTaxonomyConfig;
  pages: PagesConfig;
  ai: AIConfig;
  email: EmailConfig;
  social: SocialConfig;
  seo: SEOConfig;
  externalLinks: ExternalLinksConfig;
}

interface ExperienceConfig {
  style: ExperienceStyle;
  mode: ThemeMode;
  motionLevel: MotionLevel;
}

interface IdentityConfig {
  shopName: string;
  tagline: string;
  logoPath: string;
  faviconPath: string;
  phone: string;
  email: string;
  address: string;
  mapLink: string;
  businessHours: string;
  currency: string;
  currencySymbol: string;
  locale: string;
}

interface ThemeConfig {
  primaryColor: string;
  primaryColorDark: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  mutedTextColor: string;
  fontFamily: string;
  borderRadius: "none" | "sm" | "md" | "lg" | "full";
}

interface NavLink {
  label: string;
  href: string;
  children?: NavLink[];
}

interface NavigationConfig {
  topLinks: NavLink[];
  footerColumns: { heading: string; links: NavLink[] }[];
}

interface FeatureFlags {
  wishlist: boolean;
  reviews: boolean;
  aiChat: boolean;
  productComparison: boolean;
  externalSpecLinks: boolean;
  enquiryForm: boolean;
  stockBadge: boolean;
  discountBadge: boolean;
}

interface ProductAttribute {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "multiselect";
  unit?: string;
  options?: string[];
  filterable: boolean;
}

interface ProductCategory {
  key: string;
  label: string;
  attributes: ProductAttribute[];
}

interface ProductTaxonomyConfig {
  categories: ProductCategory[];
}

interface PagesConfig {
  homepage: {
    heroTitle: string;
    heroSubtitle: string;
    heroCTAText: string;
    heroCTALink: string;
    featuredSectionTitle: string;
    latestSectionTitle: string;
    categorySectionTitle: string;
  };
  about: { title: string; body: string };
  contact: { title: string; subtitle: string };
}

interface AIConfig {
  enabled: boolean;
  assistantName: string;
  persona: string;
  greetingMessage: string;
  topicScope: string;
  outOfScopeReply: string;
  model: string;
}

interface EmailConfig {
  fromName: string;
  replyTo: string;
  footerText: string;
}
interface SocialConfig {
  facebook?: string;
  instagram?: string;
  youtube?: string;
  whatsapp?: string;
  tiktok?: string;
  twitter?: string;
}
interface SEOConfig {
  titlePattern: string;
  defaultDescription: string;
  ogImagePath: string;
  canonicalBaseUrl: string;
}
interface ExternalLinksConfig {
  [categoryKey: string]: { label: string; urlPattern: string } | undefined;
}

// ═══════════════════════════════════════════════════════
//  TENANT — RangaPhones  (Cinematic Dark)
// ═══════════════════════════════════════════════════════

export const tenantConfig: TenantConfig = {
  businessType: "MOBILE_SHOP",

  experience: {
    style: "cinematic",
    mode: "dark",
    motionLevel: "medium",
  },

  identity: {
    shopName: "RangaPhones",
    tagline: "The future in your hands",
    logoPath: "/logo.svg",
    faviconPath: "/favicon.ico",
    phone: "+94 77 123 4567",
    email: "hello@rangaphones.lk",
    address: "123 Main Street, Colombo 03, Sri Lanka",
    mapLink: "https://maps.google.com/?q=Colombo+03",
    businessHours: "Mon–Sat: 9am – 7pm",
    currency: "LKR",
    currencySymbol: "Rs.",
    locale: "en-LK",
  },

  theme: {
    primaryColor: "#2563EB",
    primaryColorDark: "#1D4ED8",
    secondaryColor: "#7C3AED",
    accentColor: "#F59E0B",
    backgroundColor: "#050816",
    surfaceColor: "#0D111F",
    textColor: "#F1F5F9",
    mutedTextColor: "#64748B",
    fontFamily: "'Syne', 'Manrope', sans-serif",
    borderRadius: "lg",
  },

  navigation: {
    topLinks: [
      { label: "Home", href: "/" },
      {
        label: "Smartphones",
        href: "/categories/smartphones",
        children: [
          {
            label: "Samsung",
            href: "/products?categorySlug=smartphones&brand=Samsung",
          },
          {
            label: "Apple",
            href: "/products?categorySlug=smartphones&brand=Apple",
          },
          {
            label: "Xiaomi",
            href: "/products?categorySlug=smartphones&brand=Xiaomi",
          },
          { label: "All Phones", href: "/categories/smartphones" },
        ],
      },
      { label: "Tablets", href: "/categories/tablets" },
      { label: "Accessories", href: "/categories/accessories" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
    footerColumns: [
      {
        heading: "Shop",
        links: [
          { label: "Smartphones", href: "/categories/smartphones" },
          { label: "Tablets", href: "/categories/tablets" },
          { label: "Accessories", href: "/categories/accessories" },
          { label: "New Arrivals", href: "/products?sort=newest" },
          { label: "On Sale", href: "/products?inStock=true" },
        ],
      },
      {
        heading: "Help",
        links: [
          { label: "Contact Us", href: "/contact" },
          { label: "About Us", href: "/about" },
        ],
      },
    ],
  },

  features: {
    wishlist: true,
    reviews: true,
    aiChat: true,
    productComparison: false,
    externalSpecLinks: true,
    enquiryForm: true,
    stockBadge: true,
    discountBadge: true,
  },

  productTaxonomy: {
    categories: [
      {
        key: "smartphones",
        label: "Smartphones",
        attributes: [
          {
            key: "brand",
            label: "Brand",
            type: "select",
            filterable: true,
            options: [
              "Samsung",
              "Apple",
              "Xiaomi",
              "Oppo",
              "Vivo",
              "OnePlus",
              "Realme",
            ],
          },
          {
            key: "ram",
            label: "RAM",
            type: "select",
            unit: "GB",
            filterable: true,
            options: ["4", "6", "8", "12", "16"],
          },
          {
            key: "storage",
            label: "Storage",
            type: "select",
            unit: "GB",
            filterable: true,
            options: ["64", "128", "256", "512", "1000"],
          },
          {
            key: "battery",
            label: "Battery",
            type: "number",
            unit: "mAh",
            filterable: false,
          },
          {
            key: "camera",
            label: "Main Camera",
            type: "text",
            filterable: false,
          },
          { key: "display", label: "Display", type: "text", filterable: false },
          {
            key: "processor",
            label: "Processor",
            type: "text",
            filterable: false,
          },
          {
            key: "os",
            label: "OS",
            type: "select",
            filterable: true,
            options: ["Android", "iOS"],
          },
          {
            key: "network",
            label: "Network",
            type: "select",
            filterable: true,
            options: ["4G", "5G"],
          },
          { key: "color", label: "Colour", type: "text", filterable: false },
        ],
      },
      {
        key: "tablets",
        label: "Tablets",
        attributes: [
          {
            key: "brand",
            label: "Brand",
            type: "select",
            filterable: true,
            options: ["Samsung", "Apple", "Xiaomi", "Lenovo"],
          },
          {
            key: "display_size",
            label: "Display Size",
            type: "number",
            unit: "inch",
            filterable: true,
          },
          {
            key: "ram",
            label: "RAM",
            type: "select",
            unit: "GB",
            filterable: true,
            options: ["4", "6", "8", "12"],
          },
          {
            key: "storage",
            label: "Storage",
            type: "select",
            unit: "GB",
            filterable: true,
            options: ["64", "128", "256"],
          },
          {
            key: "os",
            label: "OS",
            type: "select",
            filterable: true,
            options: ["Android", "iPadOS", "Windows"],
          },
          {
            key: "connectivity",
            label: "Connectivity",
            type: "select",
            filterable: true,
            options: ["Wi-Fi Only", "Wi-Fi + Cellular"],
          },
        ],
      },
      {
        key: "accessories",
        label: "Accessories",
        attributes: [
          {
            key: "type",
            label: "Type",
            type: "select",
            filterable: true,
            options: [
              "Case",
              "Screen Protector",
              "Charger",
              "Cable",
              "Earphones",
              "Power Bank",
              "Other",
            ],
          },
          {
            key: "compatibility",
            label: "Compatible With",
            type: "text",
            filterable: false,
          },
          {
            key: "brand",
            label: "Brand",
            type: "select",
            filterable: true,
            options: [
              "Samsung",
              "Apple",
              "Baseus",
              "Anker",
              "Generic",
              "Other",
            ],
          },
        ],
      },
    ],
  },

  pages: {
    homepage: {
      heroTitle: "Find Your Perfect Phone",
      heroSubtitle:
        "Sri Lanka's most trusted source for smartphones, tablets & accessories — at prices that make sense.",
      heroCTAText: "Explore Collection",
      heroCTALink: "/products",
      featuredSectionTitle: "Featured Phones",
      latestSectionTitle: "New Arrivals",
      categorySectionTitle: "Shop by Category",
    },
    about: {
      title: "About RangaPhones",
      body: `RangaPhones has been Sri Lanka's trusted mobile retailer since 2018. We carry the latest smartphones, tablets, and accessories from all major brands with guaranteed authenticity and official warranty.`,
    },
    contact: {
      title: "Get in Touch",
      subtitle:
        "Have a question about a product? Want to check stock? We're here for you.",
    },
  },

  ai: {
    enabled: true,
    assistantName: "Ranga",
    persona:
      "You are Ranga, a friendly and knowledgeable mobile phone expert for RangaPhones. You help customers find the right phone, compare specs, and understand our products.",
    greetingMessage:
      "Hi! I'm Ranga 👋 I'm here to help you find the perfect phone. What are you looking for today?",
    topicScope:
      "mobile phones, smartphones, tablets, phone accessories, phone specifications, comparisons",
    outOfScopeReply:
      "I can only help with questions about mobile phones and our products at RangaPhones. Is there a phone I can help you with?",
    model: "gemini-2.5-flash",
  },

  email: {
    fromName: "RangaPhones",
    replyTo: "hello@rangaphones.lk",
    footerText: "© 2025 RangaPhones. 123 Main Street, Colombo 03, Sri Lanka.",
  },

  social: {
    facebook: "https://facebook.com/rangaphones",
    instagram: "https://instagram.com/rangaphones",
    whatsapp: "https://wa.me/94771234567",
    youtube: "https://youtube.com/@rangaphones",
  },

  seo: {
    titlePattern: "%s | RangaPhones",
    defaultDescription:
      "Buy the latest smartphones, tablets & accessories in Sri Lanka at the best prices. RangaPhones — Sri Lanka's most trusted mobile retailer.",
    ogImagePath: "/og-image.jpg",
    canonicalBaseUrl: "https://www.rangaphones.lk",
  },

  externalLinks: {
    smartphones: {
      label: "View Full Specs on GSM Arena",
      urlPattern:
        "https://www.gsmarena.com/search.php3?sQuickSearch=true&Q={productName}",
    },
  },
};
