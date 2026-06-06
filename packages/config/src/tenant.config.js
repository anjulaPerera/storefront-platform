"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantConfig = void 0;
// ═══════════════════════════════════════════════════════════════════
//  MOBILE SHOP TENANT — RangaPhones
//  To build a different shop: change everything below this line.
// ═══════════════════════════════════════════════════════════════════
exports.tenantConfig = {
    businessType: "MOBILE_SHOP",
    identity: {
        shopName: "RangaPhones",
        tagline: "Your trusted mobile partner",
        logoPath: "/man.jpg",
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
        primaryColor: "#1D4ED8",
        primaryColorDark: "#1E3A8A",
        secondaryColor: "#0EA5E9",
        accentColor: "#F59E0B",
        backgroundColor: "#F8FAFC",
        surfaceColor: "#FFFFFF",
        textColor: "#1E293B",
        mutedTextColor: "#64748B",
        fontFamily: "'Inter', sans-serif",
        borderRadius: "md",
    },
    navigation: {
        topLinks: [
            { label: "Home", href: "/" },
            {
                label: "Smartphones",
                href: "/categories/smartphones",
                children: [
                    { label: "Samsung", href: "/categories/smartphones?brand=Samsung" },
                    { label: "Apple", href: "/categories/smartphones?brand=Apple" },
                    { label: "Xiaomi", href: "/categories/smartphones?brand=Xiaomi" },
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
                        label: "Operating System",
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
                        label: "Operating System",
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
            heroSubtitle: "Sri Lanka's trusted source for smartphones, tablets & accessories — all at the best prices.",
            heroCTAText: "Shop Smartphones",
            heroCTALink: "/categories/smartphones",
            featuredSectionTitle: "Featured Phones",
            latestSectionTitle: "New Arrivals",
            categorySectionTitle: "Browse by Category",
        },
        about: {
            title: "About RangaPhones",
            body: `RangaPhones has been Sri Lanka's trusted mobile retailer since 2018. 
We carry the latest smartphones, tablets, and accessories from all major brands. 
Our team of experts is always ready to help you find the perfect device for your needs and budget.`,
        },
        contact: {
            title: "Get in Touch",
            subtitle: "Have a question about a product? Want to know if we have a specific model in stock? We'd love to hear from you.",
        },
    },
    ai: {
        enabled: true,
        assistantName: "Ranga",
        persona: "You are Ranga, a friendly and knowledgeable mobile phone expert assistant for RangaPhones. You help customers find the right phone, compare specs, and understand the products we sell.",
        greetingMessage: "Hi! I'm Ranga 👋 I'm here to help you find the perfect phone. What are you looking for today?",
        topicScope: "mobile phones, smartphones, tablets, phone accessories, phone specifications, comparisons between phones we sell",
        outOfScopeReply: "I'm only able to help with questions about mobile phones and our products at RangaPhones. Is there a phone or accessory I can help you with?",
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
        defaultDescription: "Buy the latest smartphones, tablets & accessories in Sri Lanka at the best prices. Visit RangaPhones — your trusted mobile partner.",
        ogImagePath: "/og-image.jpg",
        canonicalBaseUrl: "https://www.rangaphones.lk",
    },
    externalLinks: {
        smartphones: {
            label: "View Full Specs on GSM Arena",
            urlPattern: "https://www.gsmarena.com/search.php3?sQuickSearch=true&fDisplayInchesMin=&fDisplayInchesMax=&sOSes%5B%5D=&sMakers%5B%5D=&sAvailabilities%5B%5D=1&sQuickSearch=true&chk5G=selected&Q={productName}",
        },
        tablets: {
            label: "View Specs",
            urlPattern: "https://www.gsmarena.com/search.php3?sQuickSearch=true&Q={productName}",
        },
    },
};
//# sourceMappingURL=tenant.config.js.map