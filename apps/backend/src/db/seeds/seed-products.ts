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
