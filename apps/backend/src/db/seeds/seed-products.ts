import "dotenv/config";
import { pool } from "@/config/db";

interface CategorySeed {
  name: string;
  slug: string;
  description: string;
  sort_order: number;
}

interface ProductSeed {
  categorySlug: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock_quantity: number;
  sku: string;
  brand: string;
  attributes: Record<string, unknown>;
  thumbnail: string;
  external_link: string;
  is_featured: boolean;
  meta_title: string;
  meta_description: string;
}

const categories: CategorySeed[] = [
  {
    name: "Smartphones",
    slug: "smartphones",
    description: "Latest smartphones from top brands",
    sort_order: 1,
  },
  {
    name: "Tablets",
    slug: "tablets",
    description: "Tablets for work and entertainment",
    sort_order: 2,
  },
  {
    name: "Accessories",
    slug: "accessories",
    description: "Cases, chargers, cables and more",
    sort_order: 3,
  },
];

const products: ProductSeed[] = [
  // ── Existing Products ──────────────────────────────────────────────────
  {
    categorySlug: "smartphones",
    name: "Samsung Galaxy S25 Ultra",
    slug: "samsung-galaxy-s25-ultra",
    description:
      "The ultimate Samsung flagship with a built-in S Pen, 200MP camera, and Snapdragon 8 Elite processor.",
    price: 299900,
    stock_quantity: 12,
    sku: "SAM-S25U-256-BLK",
    brand: "Samsung",
    attributes: {
      ram: "12",
      storage: "256",
      battery: 5000,
      camera: "200MP + 50MP + 10MP + 12MP",
      display: '6.9" QHD+ Dynamic AMOLED 2X, 120Hz',
      processor: "Snapdragon 8 Elite",
      os: "Android",
      network: "5G",
      color: "Titanium Black",
    },
    thumbnail: "https://placehold.co/400x400/1a1a2e/ffffff?text=S25+Ultra",
    external_link:
      "https://www.gsmarena.com/samsung_galaxy_s25_ultra-12858.php",
    is_featured: true,
    meta_title: "Samsung Galaxy S25 Ultra Price in Sri Lanka | RangaPhones",
    meta_description:
      "Buy Samsung Galaxy S25 Ultra in Sri Lanka. 200MP camera, S Pen, 5G. Best price at RangaPhones.",
  },
  {
    categorySlug: "smartphones",
    name: "Apple iPhone 16 Pro Max",
    slug: "apple-iphone-16-pro-max",
    description:
      "Apple's most powerful iPhone with A18 Pro chip, ProMotion display, and advanced camera system.",
    price: 389900,
    stock_quantity: 8,
    sku: "APL-IP16PM-256-NTT",
    brand: "Apple",
    attributes: {
      ram: "8",
      storage: "256",
      battery: 4685,
      camera: "48MP Fusion + 12MP Ultra Wide + 12MP 5x Telephoto",
      display: '6.9" Super Retina XDR OLED, 120Hz ProMotion',
      processor: "A18 Pro",
      os: "iOS",
      network: "5G",
      color: "Natural Titanium",
    },
    thumbnail:
      "https://placehold.co/400x400/1a1a2e/ffffff?text=iPhone+16+Pro+Max",
    external_link: "https://www.gsmarena.com/apple_iphone_16_pro_max-12445.php",
    is_featured: true,
    meta_title: "Apple iPhone 16 Pro Max Price in Sri Lanka | RangaPhones",
    meta_description:
      "Buy Apple iPhone 16 Pro Max in Sri Lanka. A18 Pro chip, 48MP camera. Best price at RangaPhones.",
  },
  {
    categorySlug: "smartphones",
    name: "Xiaomi 14T Pro",
    slug: "xiaomi-14t-pro",
    description:
      "Xiaomi flagship with Leica-tuned cameras, 144Hz AMOLED display and 90W fast charging.",
    price: 149900,
    stock_quantity: 20,
    sku: "XMI-14TP-512-TIT",
    brand: "Xiaomi",
    attributes: {
      ram: "12",
      storage: "512",
      battery: 5000,
      camera: "50MP Leica Summilux + 50MP Tele + 12MP Ultra Wide",
      display: '6.67" AMOLED, 144Hz',
      processor: "Dimensity 9300+",
      os: "Android",
      network: "5G",
      color: "Titan Black",
    },
    thumbnail: "https://placehold.co/400x400/1a1a2e/ffffff?text=Xiaomi+14T+Pro",
    external_link: "https://www.gsmarena.com/xiaomi_14t_pro-12609.php",
    is_featured: true,
    meta_title: "Xiaomi 14T Pro Price in Sri Lanka | RangaPhones",
    meta_description:
      "Buy Xiaomi 14T Pro in Sri Lanka. Leica cameras, 144Hz AMOLED. Best price at RangaPhones.",
  },
  {
    categorySlug: "smartphones",
    name: "Samsung Galaxy A55 5G",
    slug: "samsung-galaxy-a55-5g",
    description:
      "Premium mid-range Samsung with IP67 rating, 50MP camera and smooth 120Hz Super AMOLED display.",
    price: 89900,
    stock_quantity: 35,
    sku: "SAM-A55-128-NAV",
    brand: "Samsung",
    attributes: {
      ram: "8",
      storage: "128",
      battery: 5000,
      camera: "50MP + 12MP + 5MP",
      display: '6.6" Full HD+ Super AMOLED, 120Hz',
      processor: "Exynos 1480",
      os: "Android",
      network: "5G",
      color: "Navy",
    },
    thumbnail: "https://placehold.co/400x400/1a1a2e/ffffff?text=Galaxy+A55",
    external_link: "https://www.gsmarena.com/samsung_galaxy_a55-12234.php",
    is_featured: false,
    meta_title: "Samsung Galaxy A55 5G Price in Sri Lanka | RangaPhones",
    meta_description:
      "Buy Samsung Galaxy A55 5G in Sri Lanka. 50MP camera, IP67. Best price at RangaPhones.",
  },
  {
    categorySlug: "smartphones",
    name: "Realme 13 Pro+ 5G",
    slug: "realme-13-pro-plus-5g",
    description:
      "Feature-packed mid-range with Sony LYT-600 camera sensor and 67W fast charging.",
    price: 69900,
    stock_quantity: 50,
    sku: "RLM-13PP-256-NAV",
    brand: "Realme",
    attributes: {
      ram: "12",
      storage: "256",
      battery: 5200,
      camera: "50MP Sony LYT-600 + 50MP Tele + 8MP",
      display: '6.7" AMOLED, 120Hz',
      processor: "Snapdragon 7s Gen 3",
      os: "Android",
      network: "5G",
      color: "Navigator Beige",
    },
    thumbnail: "https://fdn2.gsmarena.com/vv/bigpic/realme-11-4g-.jpg",
    external_link: "https://www.gsmarena.com/realme_13_pro+-12701.php",
    is_featured: false,
    meta_title: "Realme 13 Pro+ 5G Price in Sri Lanka | RangaPhones",
    meta_description:
      "Buy Realme 13 Pro+ 5G in Sri Lanka. Sony camera, 67W charging. Best price at RangaPhones.",
  },
  {
    categorySlug: "tablets",
    name: "Samsung Galaxy Tab S10 FE",
    slug: "samsung-galaxy-tab-s10-fe",
    description:
      'Versatile Samsung tablet with S Pen support, IP68 rating and a crisp 10.9" display.',
    price: 119900,
    stock_quantity: 15,
    sku: "SAM-TABS10FE-128-GRY",
    brand: "Samsung",
    attributes: {
      ram: "6",
      storage: "128",
      battery: 8000,
      display_size: 10.9,
      os: "Android",
      connectivity: "Wi-Fi Only",
    },
    thumbnail: "https://placehold.co/400x400/1a1a2e/ffffff?text=Tab+S10+FE",
    external_link:
      "https://www.gsmarena.com/samsung_galaxy_tab_s10_fe-12901.php",
    is_featured: false,
    meta_title: "Samsung Galaxy Tab S10 FE Price Sri Lanka | RangaPhones",
    meta_description:
      "Buy Samsung Galaxy Tab S10 FE in Sri Lanka. S Pen, IP68. Best price at RangaPhones.",
  },
  {
    categorySlug: "accessories",
    name: "Anker 65W GaN USB-C Charger",
    slug: "anker-65w-gan-usb-c-charger",
    description:
      "Compact GaN charger with 65W output. Charges laptops, phones and tablets simultaneously.",
    price: 7900,
    stock_quantity: 100,
    sku: "ANK-65W-GAN-WHT",
    brand: "Anker",
    attributes: {
      type: "Charger",
      compatibility: "USB-C universal — laptops, phones, tablets",
    },
    thumbnail: "https://placehold.co/400x400/1a1a2e/ffffff?text=Anker+65W",
    external_link: "",
    is_featured: false,
    meta_title: "Anker 65W GaN Charger Price Sri Lanka | RangaPhones",
    meta_description:
      "Buy Anker 65W GaN USB-C Charger in Sri Lanka. Charges 3 devices at once. RangaPhones.",
  },

  // ── NEW PRODUCTS ADDED BELOW (20+ Items) ──────────────────────────────

  // --- Smartphones ---
  {
    categorySlug: "smartphones",
    name: "Google Pixel 9 Pro",
    slug: "google-pixel-9-pro",
    description:
      "Google's pure Android flagship featuring advanced Gemini AI capabilities and unmatched computational photography.",
    price: 245000,
    stock_quantity: 10,
    sku: "GGL-PXL9P-128-OBS",
    brand: "Google",
    attributes: {
      ram: "16",
      storage: "128",
      battery: 4700,
      camera: "50MP + 48MP + 48MP",
      processor: "Google Tensor G4",
      os: "Android",
      color: "Obsidian",
    },
    thumbnail: "https://placehold.co/400x400/1a1a2e/ffffff?text=Pixel+9+Pro",
    external_link: "https://www.gsmarena.com/google_pixel_9_pro-13214.php",
    is_featured: true,
    meta_title: "Google Pixel 9 Pro Price in Sri Lanka | RangaPhones",
    meta_description:
      "Get the pure Android Google Pixel 9 Pro with cutting-edge Gemini AI features in Sri Lanka.",
  },
  {
    categorySlug: "smartphones",
    name: "OnePlus 13",
    slug: "oneplus-13",
    description:
      "Flagship killer reimagined with Hasselblad camera setups and ultra-fast 100W charging capabilities.",
    price: 215000,
    stock_quantity: 14,
    sku: "1PL-13-256-GRN",
    brand: "OnePlus",
    attributes: {
      ram: "12",
      storage: "256",
      battery: 6000,
      camera: "50MP + 50MP + 50MP",
      processor: "Snapdragon 8 Elite",
      os: "OxygenOS",
      color: "Arbor Green",
    },
    thumbnail: "https://placehold.co/400x400/1a1a2e/ffffff?text=OnePlus+13",
    external_link: "https://www.gsmarena.com/oneplus_13-13391.php",
    is_featured: false,
    meta_title: "OnePlus 13 Price in Sri Lanka | RangaPhones",
    meta_description:
      "Buy OnePlus 13 in Sri Lanka with 100W fast charging and Hasselblad tuned optics.",
  },
  {
    categorySlug: "smartphones",
    name: "Nothing Phone (3)",
    slug: "nothing-phone-3",
    description:
      "The unique transparent back design returns with upgraded Glyph interface 2.0 and highly streamlined performance.",
    price: 155000,
    stock_quantity: 18,
    sku: "NTH-PH3-256-GRY",
    brand: "Nothing",
    attributes: {
      ram: "12",
      storage: "256",
      battery: 5000,
      camera: "50MP + 50MP",
      processor: "Snapdragon 8s Gen 3",
      os: "Nothing OS",
      color: "Dark Grey",
    },
    thumbnail:
      "https://placehold.co/400x400/1a1a2e/ffffff?text=Nothing+Phone+3",
    external_link: "",
    is_featured: true,
    meta_title: "Nothing Phone (3) Price in Sri Lanka | RangaPhones",
    meta_description:
      "Stand out with the transparent Nothing Phone (3) available at the best rate in Sri Lanka.",
  },
  {
    categorySlug: "smartphones",
    name: "Apple iPhone 16",
    slug: "apple-iphone-16",
    description:
      "The standard iPhone 16 features the all-new Camera Control button, powerful A18 chip, and vibrant finishes.",
    price: 259000,
    stock_quantity: 25,
    sku: "APL-IP16-128-BLU",
    brand: "Apple",
    attributes: {
      ram: "8",
      storage: "128",
      battery: 3561,
      camera: "48MP + 12MP",
      processor: "A18",
      os: "iOS",
      color: "Ultramarine",
    },
    thumbnail: "https://placehold.co/400x400/1a1a2e/ffffff?text=iPhone+16",
    external_link: "https://www.gsmarena.com/apple_iphone_16-13254.php",
    is_featured: false,
    meta_title: "Apple iPhone 16 Base Price Sri Lanka | RangaPhones",
    meta_description:
      "Shop iPhone 16 base models with Apple Intelligence readiness at RangaPhones Sri Lanka.",
  },
  {
    categorySlug: "smartphones",
    name: "Samsung Galaxy S25 Plus",
    slug: "samsung-galaxy-s25-plus",
    description:
      "The perfect balance of power and size with a beautiful dynamic AMOLED screen and refined triple cameras.",
    price: 235000,
    stock_quantity: 15,
    sku: "SAM-S25P-256-SLV",
    brand: "Samsung",
    attributes: {
      ram: "12",
      storage: "256",
      battery: 4700,
      camera: "50MP + 10MP + 12MP",
      processor: "Exynos 2500",
      os: "Android",
      color: "Silver Shadow",
    },
    thumbnail: "https://placehold.co/400x400/1a1a2e/ffffff?text=S25+Plus",
    external_link: "https://www.gsmarena.com/samsung_galaxy_s25+-13309.php",
    is_featured: false,
    meta_title: "Samsung Galaxy S25+ Price in Sri Lanka | RangaPhones",
    meta_description:
      "Buy Samsung Galaxy S25 Plus in Sri Lanka. Experience premium performance and Galaxy AI.",
  },
  {
    categorySlug: "smartphones",
    name: "CMF Phone 1 by Nothing",
    slug: "cmf-phone-1",
    description:
      "Budget-friendly engineering with a modular customizable back panel and snappy day-to-day performance.",
    price: 58000,
    stock_quantity: 40,
    sku: "CMF-PH1-128-ORG",
    brand: "Nothing",
    attributes: {
      ram: "8",
      storage: "128",
      battery: 5000,
      camera: "50MP",
      processor: "Dimensity 7300",
      os: "Nothing OS",
      color: "Orange",
    },
    thumbnail: "https://placehold.co/400x400/1a1a2e/ffffff?text=CMF+Phone+1",
    external_link: "https://www.gsmarena.com/cmf_phone_1-13176.php",
    is_featured: false,
    meta_title: "CMF Phone 1 Price in Sri Lanka | RangaPhones",
    meta_description:
      "Affordable and modular CMF Phone 1 by Nothing now in stock across Sri Lanka.",
  },
  {
    categorySlug: "smartphones",
    name: "Poco F6 Pro",
    slug: "poco-f6-pro",
    description:
      "Hyper-performance mid-ranger boasting flagship Snapdragon internals and 120W hypercharge capabilities.",
    price: 139000,
    stock_quantity: 22,
    sku: "POC-F6P-512-WHT",
    brand: "Xiaomi",
    attributes: {
      ram: "12",
      storage: "512",
      battery: 5000,
      camera: "50MP + 8MP + 2MP",
      processor: "Snapdragon 8 Gen 2",
      os: "HyperOS",
      color: "White",
    },
    thumbnail: "https://placehold.co/400x400/1a1a2e/ffffff?text=Poco+F6+Pro",
    external_link: "https://www.gsmarena.com/xiaomi_poco_f6_pro-13002.php",
    is_featured: false,
    meta_title: "Poco F6 Pro Price in Sri Lanka | RangaPhones",
    meta_description:
      "Extreme gaming performance with Poco F6 Pro. Check prices at RangaPhones.",
  },
  {
    categorySlug: "smartphones",
    name: "Infinix GT 20 Pro",
    slug: "infinix-gt-20-pro",
    description:
      "Cyberpunk aesthetic gaming phone built with dedicated display processors for lag-free rendering.",
    price: 78000,
    stock_quantity: 30,
    sku: "INF-GT20P-256-CYB",
    brand: "Infinix",
    attributes: {
      ram: "12",
      storage: "256",
      battery: 5000,
      camera: "108MP + 2MP + 2MP",
      processor: "Dimensity 8200 Ultimate",
      os: "Android",
      color: "Mecha Blue",
    },
    thumbnail:
      "https://placehold.co/400x400/1a1a2e/ffffff?text=Infinix+GT+20+Pro",
    external_link: "https://www.gsmarena.com/infinix_gt_20_pro-12948.php",
    is_featured: false,
    meta_title: "Infinix GT 20 Pro Gaming Phone Sri Lanka | RangaPhones",
    meta_description:
      "Affordable gaming setups with the Infinix GT 20 Pro, featuring cyber design dynamics.",
  },

  // --- Tablets ---
  {
    categorySlug: "tablets",
    name: "Apple iPad Pro 13-inch (M4)",
    slug: "apple-ipad-pro-13-m4",
    description:
      "Impossibly thin design paired with the revolutionary Tandem OLED display and extreme M4 processing power.",
    price: 365000,
    stock_quantity: 7,
    sku: "APL-IPDPM4-256-SGR",
    brand: "Apple",
    attributes: {
      ram: "8",
      storage: "256",
      battery: 10290,
      display_size: 13.0,
      os: "iPadOS",
      connectivity: "Wi-Fi Only",
    },
    thumbnail: "https://placehold.co/400x400/1a1a2e/ffffff?text=iPad+Pro+M4",
    external_link:
      "https://www.gsmarena.com/apple_ipad_pro_13_(2024)-12938.php",
    is_featured: true,
    meta_title: "Apple iPad Pro 13 M4 Price in Sri Lanka | RangaPhones",
    meta_description:
      "Get the ultra-premium M4 iPad Pro 13-inch in Sri Lanka with Tandem OLED luxury.",
  },
  {
    categorySlug: "tablets",
    name: "Apple iPad Air 11-inch (M2)",
    slug: "apple-ipad-air-11-m2",
    description:
      "The versatile iPad Air now powered by the M2 chip, supporting the Apple Pencil Pro for enhanced creativity.",
    price: 189000,
    stock_quantity: 12,
    sku: "APL-IPDAM2-128-PUR",
    brand: "Apple",
    attributes: {
      ram: "8",
      storage: "128",
      battery: 7600,
      display_size: 11.0,
      os: "iPadOS",
      connectivity: "Wi-Fi Only",
    },
    thumbnail: "https://placehold.co/400x400/1a1a2e/ffffff?text=iPad+Air+M2",
    external_link:
      "https://www.gsmarena.com/apple_ipad_air_11_(2024)-12939.php",
    is_featured: false,
    meta_title: "Apple iPad Air 11 M2 Price Sri Lanka | RangaPhones",
    meta_description:
      "Buy iPad Air M2 online in Colombo. Great build for students and working professionals.",
  },
  {
    categorySlug: "tablets",
    name: "Samsung Galaxy Tab S10 Ultra",
    slug: "samsung-galaxy-tab-s10-ultra",
    description:
      "Massive 14.6-inch screen ecosystem engineered to challenge laptops with advanced multitasking UI structures.",
    price: 310000,
    stock_quantity: 6,
    sku: "SAM-TABS10U-512-GRY",
    brand: "Samsung",
    attributes: {
      ram: "12",
      storage: "512",
      battery: 11200,
      display_size: 14.6,
      os: "Android",
      connectivity: "5G + Wi-Fi",
    },
    thumbnail: "https://placehold.co/400x400/1a1a2e/ffffff?text=Tab+S10+Ultra",
    external_link:
      "https://www.gsmarena.com/samsung_galaxy_tab_s10_ultra-13333.php",
    is_featured: true,
    meta_title: "Samsung Galaxy Tab S10 Ultra Price Sri Lanka",
    meta_description:
      "Shop the expansive Samsung Galaxy Tab S10 Ultra layout at RangaPhones today.",
  },
  {
    categorySlug: "tablets",
    name: "Xiaomi Pad 6S Pro 12.4",
    slug: "xiaomi-pad-6s-pro",
    description:
      "A productivity beast featuring a crisp 3:2 aspect ratio display and lightning-fast 144Hz calibration.",
    price: 168000,
    stock_quantity: 14,
    sku: "XMI-PAD6SP-256-GRY",
    brand: "Xiaomi",
    attributes: {
      ram: "8",
      storage: "256",
      battery: 10000,
      display_size: 12.4,
      os: "HyperOS",
      connectivity: "Wi-Fi Only",
    },
    thumbnail:
      "https://placehold.co/400x400/1a1a2e/ffffff?text=Xiaomi+Pad+6S+Pro",
    external_link: "https://www.gsmarena.com/xiaomi_pad_6s_pro_12_4-12836.php",
    is_featured: false,
    meta_title: "Xiaomi Pad 6S Pro Price Sri Lanka | RangaPhones",
    meta_description:
      "Get great value and smooth computing power with the Xiaomi Pad 6S Pro framework.",
  },
  {
    categorySlug: "tablets",
    name: "Redmi Pad Pro",
    slug: "redmi-pad-pro",
    description:
      "Affordable family media tablet with an expansive Dolby Vision display and long-lasting runtime structures.",
    price: 79000,
    stock_quantity: 25,
    sku: "RMI-PDPRO-128-BLU",
    brand: "Xiaomi",
    attributes: {
      ram: "6",
      storage: "128",
      battery: 10000,
      display_size: 12.1,
      os: "HyperOS",
      connectivity: "Wi-Fi Only",
    },
    thumbnail: "https://placehold.co/400x400/1a1a2e/ffffff?text=Redmi+Pad+Pro",
    external_link: "https://www.gsmarena.com/xiaomi_redmi_pad_pro-12915.php",
    is_featured: false,
    meta_title: "Redmi Pad Pro Price Sri Lanka | RangaPhones",
    meta_description:
      "Budget streaming made easier with the Redmi Pad Pro from RangaPhones.",
  },
  {
    categorySlug: "tablets",
    name: "Lenovo Tab P12",
    slug: "lenovo-tab-p12",
    description:
      "Great lifestyle asset for reading and continuous video playback wrapped in an elegant metallic housing.",
    price: 92000,
    stock_quantity: 11,
    sku: "LNV-TP12-128-GRY",
    brand: "Lenovo",
    attributes: {
      ram: "8",
      storage: "128",
      battery: 10200,
      display_size: 12.7,
      os: "Android",
      connectivity: "Wi-Fi Only",
    },
    thumbnail: "https://placehold.co/400x400/1a1a2e/ffffff?text=Lenovo+Tab+P12",
    external_link: "https://www.gsmarena.com/lenovo_tab_p12-12440.php",
    is_featured: false,
    meta_title: "Lenovo Tab P12 Price in Sri Lanka | RangaPhones",
    meta_description:
      "Discover reliable entertainment capabilities with the Lenovo Tab P12 lineup.",
  },

  // --- Accessories ---
  {
    categorySlug: "accessories",
    name: "Apple AirPods Pro 2 (USB-C)",
    slug: "apple-airpods-pro-2-usbc",
    description:
      "Industry-defining active noise cancellation coupled with spatial tracking logic maps.",
    price: 68000,
    stock_quantity: 30,
    sku: "APL-APP2-USBC",
    brand: "Apple",
    attributes: {
      type: "Audio",
      compatibility: "Universal Apple Eco preferred",
    },
    thumbnail: "https://placehold.co/400x400/1a1a2e/ffffff?text=AirPods+Pro+2",
    external_link: "",
    is_featured: true,
    meta_title: "Apple AirPods Pro 2 USB-C Price Sri Lanka",
    meta_description:
      "Buy original Apple AirPods Pro 2 with Type-C configurations at RangaPhones.",
  },
  {
    categorySlug: "accessories",
    name: "Samsung Galaxy Buds3 Pro",
    slug: "samsung-galaxy-buds3-pro",
    description:
      "Futuristic blade design accents equipped with high-fidelity sound engines and ambient controls.",
    price: 54000,
    stock_quantity: 20,
    sku: "SAM-GB3P-SLV",
    brand: "Samsung",
    attributes: {
      type: "Audio",
      compatibility: "Android and Windows platforms",
    },
    thumbnail: "https://placehold.co/400x400/1a1a2e/ffffff?text=Buds3+Pro",
    external_link: "",
    is_featured: false,
    meta_title: "Samsung Galaxy Buds3 Pro Price in Sri Lanka | RangaPhones",
    meta_description:
      "Immerse yourself in audio with Samsung's blade-styled Buds3 Pro.",
  },
  {
    categorySlug: "accessories",
    name: "Anker Prime 20,000mAh Power Bank (200W)",
    slug: "anker-prime-20k-200w",
    description:
      "Ultra-high output capacity power module with comprehensive status instrumentation parameters built-in.",
    price: 34000,
    stock_quantity: 45,
    sku: "ANK-PR20K-BLK",
    brand: "Anker",
    attributes: { type: "Powerbank", capacity: "20000mAh", max_output: "200W" },
    thumbnail:
      "https://placehold.co/400x400/1a1a2e/ffffff?text=Anker+Prime+20K",
    external_link: "",
    is_featured: true,
    meta_title: "Anker Prime 200W Power Bank Price Sri Lanka",
    meta_description:
      "Charge laptops securely on the move with the elite Anker Prime bank matrix.",
  },
  {
    categorySlug: "accessories",
    name: "JBL Flip 6 Portable Waterproof Speaker",
    slug: "jbl-flip-6-black",
    description:
      "Powerful 2-way speaker structure offering thunderous bass output matrices in tough outdoor proof build profiles.",
    price: 36000,
    stock_quantity: 25,
    sku: "JBL-FLP6-BLK",
    brand: "JBL",
    attributes: { type: "Speaker", protection: "IP67 Water and Dust Proof" },
    thumbnail: "https://placehold.co/400x400/1a1a2e/ffffff?text=JBL+Flip+6",
    external_link: "",
    is_featured: false,
    meta_title: "JBL Flip 6 Waterproof Speaker Price Sri Lanka",
    meta_description:
      "Original JBL portable audio gear distribution channel networks.",
  },
  {
    categorySlug: "accessories",
    name: "Anker Soundcore Space One",
    slug: "anker-soundcore-space-one",
    description:
      "Comfortable over-ear active noise cancelling headphones with crisp Hi-Res wireless audio verification maps.",
    price: 24500,
    stock_quantity: 40,
    sku: "ANK-SDC-SO-BLK",
    brand: "Anker",
    attributes: { type: "Audio", playback_hours: 40 },
    thumbnail: "https://placehold.co/400x400/1a1a2e/ffffff?text=Space+One",
    external_link: "",
    is_featured: false,
    meta_title: "Anker Soundcore Space One Sri Lanka Price | RangaPhones",
    meta_description:
      "Affordable over-ear comfort from the acclaimed Soundcore space series.",
  },
  {
    categorySlug: "accessories",
    name: "Apple 20W USB-C Power Adapter",
    slug: "apple-20w-usb-c-adapter",
    description:
      "Official Apple charging hub architecture providing fast operational cycles to compatible configurations.",
    price: 7500,
    stock_quantity: 150,
    sku: "APL-20W-USBC",
    brand: "Apple",
    attributes: { type: "Charger", output: "20W" },
    thumbnail: "https://placehold.co/400x400/1a1a2e/ffffff?text=Apple+20W",
    external_link: "",
    is_featured: false,
    meta_title: "Original Apple 20W Charger Price Sri Lanka",
    meta_description:
      "Secure factory spec Apple charging blocks for clean diagnostic batteries.",
  },
  {
    categorySlug: "accessories",
    name: "Ugreen Nexode Pro 100W GaN Charger",
    slug: "ugreen-nexode-pro-100w",
    description:
      "4-Port compact structural footprint utilizing modern GaN generation chips for heat variance control optimizations.",
    price: 16500,
    stock_quantity: 60,
    sku: "UGR-NX100-BLK",
    brand: "Ugreen",
    attributes: { type: "Charger", ports: "3x USB-C + 1x USB-A" },
    thumbnail: "https://placehold.co/400x400/1a1a2e/ffffff?text=Ugreen+100W",
    external_link: "",
    is_featured: false,
    meta_title: "Ugreen Nexode Pro 100W Price Sri Lanka | RangaPhones",
    meta_description:
      "Consolidate power systems into one premium wall unit with Ugreen Nexode arrays.",
  },
];

async function seedProducts(): Promise<void> {
  const client = await pool.connect();

  try {
    // ── Categories ──────────────────────────────────────────────────────
    console.log("🌱  Seeding categories...");
    const categoryIdMap = new Map<string, string>();

    for (const cat of categories) {
      const existing = await client.query<{ id: string }>(
        "SELECT id FROM categories WHERE slug = $1",
        [cat.slug],
      );

      if (existing.rows.length > 0) {
        categoryIdMap.set(cat.slug, existing.rows[0].id);
        console.log(`  ⏭️   Category exists: ${cat.name}`);
        continue;
      }

      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO categories (name, slug, description, sort_order)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [cat.name, cat.slug, cat.description, cat.sort_order],
      );
      categoryIdMap.set(cat.slug, rows[0].id);
      console.log(`  ✅  Category: ${cat.name}`);
    }
    // ── Products ────────────────────────────────────────────────────────
    console.log("🌱  Seeding products...");

    for (const prod of products) {
      const categoryId = categoryIdMap.get(prod.categorySlug);
      if (!categoryId) {
        console.warn(`  ⚠️   No category found for slug: ${prod.categorySlug}`);
        continue;
      }

      const existing = await client.query<{ id: string }>(
        "SELECT id FROM products WHERE slug = $1",
        [prod.slug],
      );

      if (existing.rows.length > 0) {
        console.log(`  ⏭️   Product exists: ${prod.name}`);
        continue;
      }

      await client.query(
        `INSERT INTO products
           (category_id, name, slug, description, price, stock_quantity, sku, brand,
            attributes, thumbnail, external_link, is_featured, meta_title, meta_description)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [
          categoryId,
          prod.name,
          prod.slug,
          prod.description,
          prod.price,
          prod.stock_quantity,
          prod.sku,
          prod.brand,
          JSON.stringify(prod.attributes),
          prod.thumbnail,
          prod.external_link || null,
          prod.is_featured,
          prod.meta_title,
          prod.meta_description,
        ],
      );
      console.log(`  ✅  Product: ${prod.name}`);
    }

    console.log("🎉  Product seed complete");
  } finally {
    client.release();
    await pool.end();
  }
}

seedProducts().catch((err: Error) => {
  console.error("❌  Product seed failed:", err.message);
  process.exit(1);
});
