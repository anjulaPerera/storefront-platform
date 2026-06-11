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

  const model = getClient().getGenerativeModel({
    model: tenantConfig.ai.model ?? "gemini-2.5-flash",
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

  // Convert history to Gemini format (assistant → model)
  const geminiHistory: Content[] = history.slice(-10).map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  })) .reduce<Content[]>((acc, turn) => {
    if (acc.length === 0 && turn.role === "model") return acc;
    return [...acc, turn];
  }, []);

  const chatSession = model.startChat({ history: geminiHistory });
  const result = await chatSession.sendMessage(message);
  const reply = result.response.text();

  // Save both turns (non-blocking)
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
