export type BusinessType = "MOBILE_SHOP" | "COMPUTER_SHOP" | "GIFT_SHOP" | "ELECTRONICS" | "CUSTOM";
export interface TenantConfig {
    businessType: BusinessType;
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
    footerColumns: {
        heading: string;
        links: NavLink[];
    }[];
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
    about: {
        title: string;
        body: string;
    };
    contact: {
        title: string;
        subtitle: string;
    };
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
    [categoryKey: string]: {
        label: string;
        urlPattern: string;
    } | undefined;
}
export declare const tenantConfig: TenantConfig;
export {};
//# sourceMappingURL=tenant.config.d.ts.map