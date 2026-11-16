import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from "../../../lib/chatPrompt";

/* ---------------------------------------------------------------------------
   POST /api/chat — the portfolio chatbot.

   The browser sends the running conversation; this adds the system prompt and
   the API key (neither of which ever reaches the client) and returns one
   reply as `{ reply }`.

   Everything here that looks defensive is cost control: the endpoint is
   public, so each limit below caps what a stranger can spend on the key.
--------------------------------------------------------------------------- */

/** Overridable without a code change if the model is renamed or retired. */
const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

const MAX_MESSAGES = 20; // what a request may carry
const HISTORY_SENT = 10; // what is actually forwarded to the model
const MAX_USER_CHARS = 500;
const MAX_REPLY_CHARS = 2000; // our own replies, echoed back as history

/* Per-IP rate limit, held in memory. On serverless this is per warm instance
   rather than global, so it is a speed bump, not a guarantee — enough to stop
   a held-down Enter key or a naive loop. The hard ceiling is the quota on the
   API key itself. */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }

  recent.push(now);
  hits.set(ip, recent);

  /* Keep the map from growing without bound on a long-lived instance. */
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }

  return false;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Returns the cleaned conversation, or null if the body is not one. */
function parseMessages(body: unknown): ChatMessage[] | null {
  const messages = (body as { messages?: unknown } | null)?.messages;
  if (!Array.isArray(messages)) return null;
  if (messages.length === 0 || messages.length > MAX_MESSAGES) return null;

  const cleaned: ChatMessage[] = [];
  for (const message of messages) {
    const { role, content } = (message ?? {}) as Record<string, unknown>;
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string" || !content.trim()) return null;
    if (role === "user" && content.length > MAX_USER_CHARS) return null;

    cleaned.push({ role, content: content.slice(0, MAX_REPLY_CHARS) });
  }

  /* There has to be a question to answer. */
  if (cleaned[cleaned.length - 1].role !== "user") return null;

  /* Only recent history is sent, and Gemini requires it to open on a user
     turn, so a leading reply left behind by the slice is dropped. */
  const recent = cleaned.slice(-HISTORY_SENT);
  while (recent[0].role !== "user") recent.shift();
  return recent;
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[chat] GEMINI_API_KEY is not set");
    return Response.json({ error: "Chat is not configured" }, { status: 503 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const messages = parseMessages(body);
  if (!messages) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      /* Gemini calls the assistant "model" and wraps text in parts. */
      contents: messages.map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      })),
      config: {
        systemInstruction: SYSTEM_PROMPT,
        /* Brevity is enforced by the prompt. This is only a ceiling, and it
           is generous because on thinking models the budget is shared with
           the model's reasoning: too low and the reply comes back cut off
           or empty. */
        maxOutputTokens: 1000,
        temperature: 0.6,
      },
    });

    const reply = response.text?.trim();
    if (!reply) {
      console.error("[chat] empty reply", response.candidates?.[0]?.finishReason);
      return Response.json({ error: "No reply" }, { status: 502 });
    }

    return Response.json({ reply });
  } catch (error) {
    console.error("[chat]", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
