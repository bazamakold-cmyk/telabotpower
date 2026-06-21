import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";

/**
 * AI provider layer for Phase 6 RAG.
 * - Embeddings: Voyage AI (Anthropic has no embeddings endpoint). voyage-3 = 1024 dims.
 * - Generation: Claude via the official @anthropic-ai/sdk.
 * Config (model names, RAG knobs, system prompt) comes from the AiSetting row so a
 * Super Admin can tune it in the UI without a redeploy. Keys live in env (never the DB).
 */

/** Thrown when a required API key / provider is missing — callers surface a friendly Thai message. */
export class AiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiConfigError";
  }
}

/** voyage-3 output dimension — MUST match `vector(1024)` in the schema/migration. */
export const EMBED_DIM = 1024;

export type AiSettings = {
  provider: string;
  chatModel: string;
  embedModel: string;
  systemPrompt: string;
  ragTopK: number;
  ragMinScore: number;
  autoReplyMinConfidence: number;
};

const DEFAULT_SYSTEM_PROMPT = [
  "คุณคือผู้ช่วย AI ของทีมแอดมิน ตอบคำถามโดยอ้างอิงจาก “เอกสารอ้างอิง” ที่ให้มาเท่านั้น",
  "ตอบเป็นภาษาไทย กระชับ สุภาพ ตรงประเด็น",
  "ถ้าข้อมูลในเอกสารไม่พอจะตอบ ให้บอกตรง ๆ ว่าไม่พบข้อมูลในคลังความรู้ ห้ามเดาหรือแต่งข้อมูลขึ้นเอง",
].join("\n");

const DEFAULTS: AiSettings = {
  provider: "anthropic",
  chatModel: "claude-sonnet-4-6",
  embedModel: "voyage-3",
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  ragTopK: 5,
  ragMinScore: 0.4,
  autoReplyMinConfidence: 0.5,
};

export async function getAiSettings(): Promise<AiSettings> {
  const s = await db.aiSetting.findUnique({ where: { id: "default" } });
  if (!s) return DEFAULTS;
  return {
    provider: s.provider,
    chatModel: s.chatModel,
    embedModel: s.embedModel,
    systemPrompt: s.systemPrompt?.trim() || DEFAULT_SYSTEM_PROMPT,
    ragTopK: s.ragTopK,
    ragMinScore: s.ragMinScore,
    autoReplyMinConfidence: s.autoReplyMinConfidence,
  };
}

/** Format a JS number[] as a pgvector literal for raw SQL: `[0.1,0.2,...]`. */
export function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(",")}]`;
}

const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";
const VOYAGE_BATCH = 96; // Voyage accepts up to 128 inputs/request; stay under it.

/**
 * Embed texts with Voyage. `input_type` matters: "document" when indexing,
 * "query" when searching — it improves retrieval quality.
 */
export async function embedTexts(
  texts: string[],
  inputType: "document" | "query",
  model: string = DEFAULTS.embedModel
): Promise<number[][]> {
  const key = process.env.VOYAGE_API_KEY;
  if (!key) throw new AiConfigError("ยังไม่ได้ตั้งค่า VOYAGE_API_KEY (สำหรับสร้าง embedding)");
  if (texts.length === 0) return [];

  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += VOYAGE_BATCH) {
    const batch = texts.slice(i, i + VOYAGE_BATCH);
    let res: Response;
    try {
      res = await fetch(VOYAGE_URL, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        body: JSON.stringify({ input: batch, model, input_type: inputType }),
      });
    } catch {
      throw new AiConfigError("เชื่อมต่อ Voyage ไม่สำเร็จ");
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new AiConfigError(`Voyage error ${res.status}: ${detail.slice(0, 200)}`);
    }
    const json = (await res.json()) as { data?: { embedding: number[]; index: number }[] };
    const data = [...(json.data ?? [])].sort((a, b) => a.index - b.index);
    if (data.length !== batch.length) {
      throw new AiConfigError("Voyage ตอบกลับจำนวน embedding ไม่ครบ");
    }
    for (const d of data) {
      if (d.embedding.length !== EMBED_DIM) {
        throw new AiConfigError(
          `embedding มี ${d.embedding.length} มิติ ≠ ${EMBED_DIM} (เปลี่ยน embedModel ต้องแก้ migration)`
        );
      }
      out.push(d.embedding);
    }
  }
  return out;
}

/** Convenience: embed a single search query, returns one vector. */
export async function embedQuery(text: string, model?: string): Promise<number[]> {
  const [v] = await embedTexts([text], "query", model);
  return v;
}

/** Generate a grounded answer with Claude. `system` + `prompt` already include the RAG context. */
export async function generateAnswer(opts: {
  system: string;
  prompt: string;
  model: string;
  maxTokens?: number;
}): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new AiConfigError("ยังไม่ได้ตั้งค่า ANTHROPIC_API_KEY (สำหรับให้ Claude ตอบ)");
  const client = new Anthropic({ apiKey: key });

  const resp = await client.messages.create({
    model: opts.model,
    max_tokens: opts.maxTokens ?? 1024,
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
  });

  return resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}
