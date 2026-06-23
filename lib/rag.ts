import { Prisma } from "@prisma/client";
import { type AiSettings, embedQuery, generateAnswer, getAiSettings, toVectorLiteral } from "@/lib/ai";
import { db } from "@/lib/db";

/**
 * Reusable RAG core shared by the AI Assistant page and the Telegram bot.
 * embed question → cosine search across one-or-more collections → grounded Claude answer.
 */

export type RagSource = { content: string; score: number };
export type RagResult = {
  answer: string;
  sources: RagSource[];
  confidence: number; // top cosine similarity (0..1)
  rowsFound: number; // chunks returned before the minScore filter
  hadContext: boolean; // at least one chunk passed minScore (Claude was asked)
};

export async function ragAnswer(opts: {
  collectionIds: string[];
  question: string;
  extraSystem?: string; // group purpose / persona to prepend to the system prompt
  settings?: AiSettings;
  maxTokens?: number;
}): Promise<RagResult> {
  const settings = opts.settings ?? (await getAiSettings());
  const empty: RagResult = { answer: "", sources: [], confidence: 0, rowsFound: 0, hadContext: false };
  if (opts.collectionIds.length === 0 || !opts.question.trim()) return empty;

  const qvec = await embedQuery(opts.question, settings.embedModel);
  const vec = toVectorLiteral(qvec);
  const rows = await db.$queryRaw<RagSource[]>`
    SELECT "content", 1 - ("embedding" <=> ${vec}::vector) AS score
    FROM "KnowledgeChunk"
    WHERE "collectionId" IN (${Prisma.join(opts.collectionIds)})
    ORDER BY "embedding" <=> ${vec}::vector
    LIMIT ${settings.ragTopK}
  `;

  const relevant = rows.filter((r) => r.score >= settings.ragMinScore);
  if (relevant.length === 0) {
    return { ...empty, confidence: rows[0]?.score ?? 0, rowsFound: rows.length };
  }

  const context = relevant.map((r, i) => `[${i + 1}] ${r.content}`).join("\n\n");
  const system = opts.extraSystem?.trim()
    ? `${settings.systemPrompt}\n\nบริบทของกลุ่มนี้: ${opts.extraSystem.trim()}`
    : settings.systemPrompt;
  const prompt = [
    "เอกสารอ้างอิง:",
    context,
    "",
    `คำถาม: ${opts.question}`,
    "",
    "กรุณาตอบโดยอ้างอิงจากเอกสารอ้างอิงข้างต้นเท่านั้น",
  ].join("\n");

  const answer = await generateAnswer({ system, prompt, model: settings.chatModel, maxTokens: opts.maxTokens });
  return {
    answer,
    sources: relevant,
    confidence: relevant[0].score,
    rowsFound: rows.length,
    hadContext: true,
  };
}

export type BotAction = "send" | "draft" | "none";

/**
 * Decide what the Telegram bot does with a RAG result. Pure (unit-tested):
 * - OFF or no relevant context → do nothing
 * - AUTO_REPLY → auto-send when confident enough, otherwise fall back to a draft
 *   BUT the system-wide `globalAutoReply` switch (BotSetting.aiAutoReply) is a master
 *   kill switch: when off, AUTO_REPLY groups are demoted to draft-only (never auto-send)
 * - DRAFT → always queue a draft for an admin to review
 */
export function decideBotAction(p: {
  globalAutoReply: boolean;
  botMode: "AUTO_REPLY" | "DRAFT" | "OFF";
  hadContext: boolean;
  confidence: number;
  autoReplyMinConfidence: number;
}): BotAction {
  if (p.botMode === "OFF" || !p.hadContext) return "none";
  if (p.botMode === "AUTO_REPLY" && p.globalAutoReply) {
    return p.confidence >= p.autoReplyMinConfidence ? "send" : "draft";
  }
  return "draft";
}
