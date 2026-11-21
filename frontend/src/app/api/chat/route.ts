import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { SYSTEM_PROMPT } from "../../../lib/chatPrompt";

/* ---------------------------------------------------------------------------
   POST /api/chat — the portfolio chatbot.

   The browser sends the running conversation; this adds the system prompt and
   the API key (neither of which ever reaches the client) and streams the
   reply back as plain text.

   Everything here that looks defensive is cost control: the endpoint is
   public, so each limit below caps what a stranger can spend on the key.
--------------------------------------------------------------------------- */

/* Models to try, in order; overridable as a comma-separated list without a
   code change. Lite models are used on purpose: on this key the full Flash
   models queued for 40–70 s before the first word, the Lite ones answered in
   1–3 s, and for short answers from a fixed fact sheet they are as good.
   If one is overloaded, out of quota, retired or slow to start, the next one
   answers instead. */
const MODELS = (process.env.GEMINI_MODEL || "gemini-3.5-flash-lite,gemini-3.1-flash-lite")
  .split(",")
  .map((name) => name.trim())
  .filter(Boolean);

/* How long a model may take to produce its first words before the next one
   is tried. The last model in the list is always waited for. */
const FIRST_WORDS_TIMEOUT_MS = 8000;

/* Short factual answers gain nothing from long reasoning, and thinking adds
   to the wait. Not every model accepts every level, so a model that rejects
   it is simply asked again without it. */
const THINKING = { thinkingLevel: ThinkingLevel.MINIMAL };

/* One client per warm instance rather than one per request. */
let ai: GoogleGenAI | undefined;

type Contents = { role: string; parts: { text: string }[] }[];

/** Starts a reply and waits for its first words, so a model that fails or
    stalls can be swapped out before anything is sent to the visitor. */
async function startReply(model: string, contents: Contents, isLast: boolean) {
  const attempt = async (thinking: boolean) => {
    const abort = new AbortController();
    const timer = isLast ? undefined : setTimeout(() => abort.abort(), FIRST_WORDS_TIMEOUT_MS);
    try {
      const stream = await ai!.models.generateContentStream({
        model,
        contents,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          ...(thinking && { thinkingConfig: THINKING }),
          /* Brevity is enforced by the prompt; this is only a ceiling. */
          maxOutputTokens: 400,
          temperature: 0.6,
          abortSignal: abort.signal,
        },
      });
      let first = await stream.next();
      while (!first.done && !first.value.text) first = await stream.next();
      if (first.done) throw new Error(`${model} returned no text`);
      return { first: first.value.text!, rest: stream };
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    return await attempt(true);
  } catch (error) {
    /* 400 is the model refusing the request as written, which here can only
       be the thinking setting; anything else is passed on to the caller. */
    if ((error as { status?: number }).status === 400) return attempt(false);
    throw error;
  }
}

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

  ai ??= new GoogleGenAI({ apiKey });
  /* Gemini calls the assistant "model" and wraps text in parts. */
  const contents: Contents = messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));

  let reply: Awaited<ReturnType<typeof startReply>> | undefined;
  for (const [index, model] of MODELS.entries()) {
    try {
      reply = await startReply(model, contents, index === MODELS.length - 1);
      break;
    } catch (error) {
      console.error(`[chat] ${model} failed, trying the next model`, error);
    }
  }
  if (!reply) {
    return Response.json({ error: "Something went wrong" }, { status: 502 });
  }
  const { first, rest } = reply;

  /* The reply is sent as plain text while it is written, so the first words
     reach the visitor almost at once. Errors before this point are JSON with
     a status; once streaming has begun the status is already 200, so a
     failure just ends the text early and the client handles a short or empty
     reply. */
  const encoder = new TextEncoder();
  const replyStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode(first));
        for await (const chunk of rest) {
          if (chunk.text) controller.enqueue(encoder.encode(chunk.text));
        }
      } catch (error) {
        console.error("[chat] stream", error);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(replyStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
