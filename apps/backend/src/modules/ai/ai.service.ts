import {
  GoogleGenerativeAI,
  Content,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { pool } from "@/config/db";
import { tenantConfig } from "@storefront/config";

// ─── Client (singleton) ───────────────────────────────────────────────────────

let genAI: GoogleGenerativeAI | null = null;

const FALLBACK_MODELS = [
  tenantConfig.ai.model ?? "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
].filter((value, index, self) => self.indexOf(value) === index);

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is not set");
    genAI = new GoogleGenerativeAI(key);
  }
  return genAI;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  reply: string;
  sessionId: string;
}

export interface ProductDescriptionResult {
  description: string;
  metaTitle: string;
  metaDescription: string;
  keyFeatures: string[];
  /** Category-specific attribute values keyed by attribute key */
  attributes?: Record<string, string>;
}

// ─── Build the attribute schema hint for the AI prompt ───────────────────────

function buildAttributeSchemaHint(categoryKey: string): {
  schemaText: string;
  exampleJson: string;
} {
  const category = tenantConfig.productTaxonomy.categories.find(
    (c) => c.key === categoryKey,
  );

  if (!category) return { schemaText: "", exampleJson: "" };

  const lines = category.attributes.map((attr) => {
    const optionsHint =
      attr.type === "select" && attr.options?.length
        ? ` — must be one of: ${attr.options.map((o) => `"${o}"`).join(", ")}`
        : attr.type === "number"
          ? ` — numeric value only (no unit suffix)`
          : "";
    return `  "${attr.key}": "<${attr.label}${attr.unit ? ` in ${attr.unit}` : ""}>${optionsHint}"`;
  });

  const exampleKeys = category.attributes.map((attr) => `"${attr.key}": ""`);

  return {
    schemaText: `\n\nFor the "${category.label}" category, also return an "attributes" object with these keys:\n{\n${lines.join(",\n")}\n}`,
    exampleJson: `"attributes": { ${exampleKeys.join(", ")} }`,
  };
}

// ─── Product context injection (RAG-lite) ─────────────────────────────────────

async function fetchProductContext(query: string): Promise<string> {
  try {
    const { rows } = await pool.query(
      `SELECT name, brand, price, attributes, description
       FROM products
       WHERE is_active = true
         AND search_vector @@ plainto_tsquery('english', $1)
       ORDER BY ts_rank(search_vector, plainto_tsquery('english', $1)) DESC
       LIMIT 5`,
      [query],
    );

    if (rows.length === 0) return "";

    const lines = (rows as Record<string, unknown>[]).map((p) => {
      const attrs = p.attributes as Record<string, unknown>;
      const specParts = Object.entries(attrs)
        .map(([k, v]) => `${k}: ${String(v)}`)
        .join(", ");
      return `- ${p.name as string} (${(p.brand as string) ?? "No brand"}) — Price: ${tenantConfig.identity.currencySymbol}${parseFloat(String(p.price)).toLocaleString()}${specParts ? ` | Specs: ${specParts}` : ""}`;
    });

    return `\n\nRelevant products from our inventory:\n${lines.join("\n")}`;
  } catch {
    return "";
  }
}

// ─── System prompt builder ────────────────────────────────────────────────────

function buildSystemPrompt(productContext: string): string {
  const { identity, ai } = tenantConfig;

  return `You are ${ai.assistantName}, the helpful assistant for ${identity.shopName}.

${ai.persona}

STRICT RULES:
1. You ONLY answer questions related to: ${ai.topicScope}
2. If asked anything outside this scope, respond EXACTLY: "${ai.outOfScopeReply}"
3. NEVER make up products, prices, or specifications not provided below
4. NEVER discuss competitor shops or prices
5. Keep answers concise and friendly
6. If a customer asks about stock or availability, direct them to contact us at ${identity.phone}
7. Always respond in the same language the customer uses${productContext}`;
}

// ─── Gemini fallback helper ───────────────────────────────────────────────────

function isRetryableGeminiError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes("503") ||
    message.includes("high demand") ||
    message.includes("429") ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes("Service Unavailable")
  );
}

async function generateWithFallback(
  message: string,
  history: Content[],
  systemInstruction: string,
): Promise<{ reply: string; model: string }> {
  let lastError: unknown;

  for (const modelName of FALLBACK_MODELS) {
    try {
      console.log(`[AI] Trying Gemini model: ${modelName}`);

      const model = getClient().getGenerativeModel({
        model: modelName,
        systemInstruction,
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
      });

      const chatSession = model.startChat({ history });
      const result = await chatSession.sendMessage(message);

      return { reply: result.response.text(), model: modelName };
    } catch (err) {
      lastError = err;
      console.error(`[AI] ${modelName} failed:`, err);
      if (!isRetryableGeminiError(err)) throw err;
      console.warn(`[AI] Falling back from ${modelName}...`);
    }
  }

  throw lastError;
}

// ─── Product description + attribute generator ────────────────────────────────

export async function generateProductDescription(
  productName: string,
  externalLink?: string,
  categoryKey?: string,
): Promise<ProductDescriptionResult> {
  const client = getClient();

  // Build the extra attribute section of the prompt when a category is known
  const { schemaText, exampleJson } = categoryKey
    ? buildAttributeSchemaHint(categoryKey)
    : { schemaText: "", exampleJson: "" };

  const attributesField = categoryKey
    ? `,\n  "attributes": { /* keys listed above */ }`
    : "";

  const prompt = `You are an expert ecommerce copywriter and SEO specialist.

Generate compelling product content for: "${productName}"
${externalLink ? `\nReference specification URL: ${externalLink}\nPlease use this URL to get accurate specs.` : ""}${schemaText}

Search the web for current specifications, features, and information about this product.

Return ONLY valid JSON with no markdown formatting, no code fences, no extra text — just the raw JSON object:

{
  "description": "2-3 paragraph marketing description. First paragraph: hook and headline benefit. Second paragraph: key specs and standout features. Third paragraph: who it's for and value proposition.",
  "metaTitle": "SEO meta title, under 60 characters, include brand and model",
  "metaDescription": "SEO meta description, under 155 characters, include a benefit and a soft CTA",
  "keyFeatures": [
    "Feature with spec detail",
    "Feature with spec detail",
    "Feature with spec detail",
    "Feature with spec detail",
    "Feature with spec detail"
  ]${attributesField}
}

${categoryKey ? `For the attributes object, use the exact keys listed above and accurate real-world values for this product. Example shape: { ${exampleJson} }` : ""}`;

  let lastError: unknown;

  for (const modelName of FALLBACK_MODELS) {
    // First attempt: with Google Search grounding
    try {
      console.log(`[AI:ProductGen] Trying ${modelName} with web grounding`);

      const model = client.getGenerativeModel({
        model: modelName,
        // @ts-expect-error — googleSearch grounding is supported at runtime
        tools: [{ googleSearch: {} }],
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const clean = text.replace(/```json|```/g, "").trim();

      const parsed = JSON.parse(clean) as ProductDescriptionResult;
      console.log(`[AI:ProductGen] Success with ${modelName} (grounded)`);
      return parsed;
    } catch (groundingErr) {
      console.warn(
        `[AI:ProductGen] ${modelName} grounding failed, trying without:`,
        groundingErr,
      );

      // Second attempt: same model without grounding
      try {
        const model = client.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const clean = text.replace(/```json|```/g, "").trim();

        const parsed = JSON.parse(clean) as ProductDescriptionResult;
        console.log(`[AI:ProductGen] Success with ${modelName} (no grounding)`);
        return parsed;
      } catch (plainErr) {
        lastError = plainErr;
        console.error(`[AI:ProductGen] ${modelName} also failed:`, plainErr);

        if (!isRetryableGeminiError(plainErr)) {
          throw plainErr;
        }
      }
    }
  }

  throw (
    lastError ??
    new Error("All models failed for product description generation")
  );
}

// ─── Conversation persistence ─────────────────────────────────────────────────

async function saveMessages(
  sessionId: string,
  userMessage: string,
  assistantReply: string,
  userId?: string,
): Promise<void> {
  await pool.query(
    `INSERT INTO ai_conversations (session_id, user_id, role, content)
     VALUES ($1,$2,'user',$3), ($1,$2,'assistant',$4)`,
    [sessionId, userId ?? null, userMessage, assistantReply],
  );
}

// ─── Chat ────────────────────────────────────────────────────────────────────

export async function chat(
  message: string,
  sessionId: string,
  history: ChatMessage[],
  userId?: string,
): Promise<ChatResponse> {
  const productContext = await fetchProductContext(message);
  const systemInstruction = buildSystemPrompt(productContext);

  const geminiHistory: Content[] = history
    .slice(-10)
    .map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }))
    .reduce<Content[]>((acc, turn) => {
      if (acc.length === 0 && turn.role === "model") return acc;
      return [...acc, turn];
    }, []);

  const { reply, model } = await generateWithFallback(
    message,
    geminiHistory,
    systemInstruction,
  );

  console.log(`[AI] Reply generated using ${model}`);

  saveMessages(sessionId, message, reply, userId).catch(console.error);

  return { reply, sessionId };
}

export async function getSessionHistory(
  sessionId: string,
): Promise<ChatMessage[]> {
  const { rows } = await pool.query(
    `SELECT role, content FROM ai_conversations
     WHERE session_id = $1
     ORDER BY created_at ASC
     LIMIT 50`,
    [sessionId],
  );

  return (rows as Record<string, unknown>[]).map((r) => ({
    role: (r.role === "assistant"
      ? "assistant"
      : "user") as ChatMessage["role"],
    content: r.content as string,
  }));
}
