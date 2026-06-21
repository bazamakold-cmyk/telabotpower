"use server";

import { AiConfigError, embedQuery, generateAnswer, getAiSettings, toVectorLiteral } from "@/lib/ai";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { USE_MOCK } from "@/lib/use-mock";

export type AskSource = { content: string; score: number };
export type AskResult =
  | { ok: true; answer: string; sources: AskSource[]; confidence: number }
  | { ok: false; error: string };

/**
 * RAG: embed the question, find the most similar chunks within the chosen collection
 * (pgvector cosine), then have Claude answer grounded in those chunks only.
 */
export async function askAssistant(collectionId: string, question: string): Promise<AskResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "กรุณาเข้าสู่ระบบ" };

  const q = question.trim();
  if (!collectionId) return { ok: false, error: "กรุณาเลือกคลังความรู้ก่อน" };
  if (!q) return { ok: false, error: "กรุณาพิมพ์คำถาม" };
  if (USE_MOCK) {
    return { ok: true, answer: "(โหมดจำลอง) ต่อ API key จริงเพื่อให้ AI ตอบจากคลังความรู้", sources: [], confidence: 0 };
  }

  try {
    const settings = await getAiSettings();
    const qvec = await embedQuery(q, settings.embedModel);
    const vec = toVectorLiteral(qvec);

    // Cosine similarity = 1 - cosine distance (<=>). Higher score = more relevant.
    const rows = await db.$queryRaw<AskSource[]>`
      SELECT "content", 1 - ("embedding" <=> ${vec}::vector) AS score
      FROM "KnowledgeChunk"
      WHERE "collectionId" = ${collectionId}
      ORDER BY "embedding" <=> ${vec}::vector
      LIMIT ${settings.ragTopK}
    `;

    const relevant = rows.filter((r) => r.score >= settings.ragMinScore);
    if (relevant.length === 0) {
      return {
        ok: true,
        answer:
          rows.length === 0
            ? "ยังไม่พบข้อมูลในคลังนี้ — อาจยังไม่ได้สร้างดัชนี (ไปที่หน้า “คลังความรู้” แล้วกด “สร้างดัชนี (RAG)”)"
            : "ขออภัย ไม่พบข้อมูลที่เกี่ยวข้องกับคำถามนี้ในคลังความรู้ครับ",
        sources: [],
        confidence: rows[0]?.score ?? 0,
      };
    }

    const context = relevant.map((r, i) => `[${i + 1}] ${r.content}`).join("\n\n");
    const prompt = [
      "เอกสารอ้างอิง:",
      context,
      "",
      `คำถาม: ${q}`,
      "",
      "กรุณาตอบโดยอ้างอิงจากเอกสารอ้างอิงข้างต้นเท่านั้น",
    ].join("\n");

    const answer = await generateAnswer({
      system: settings.systemPrompt,
      prompt,
      model: settings.chatModel,
    });

    return {
      ok: true,
      answer: answer || "ขออภัย ไม่สามารถสร้างคำตอบได้ในขณะนี้",
      sources: relevant,
      confidence: relevant[0].score,
    };
  } catch (e) {
    if (e instanceof AiConfigError) return { ok: false, error: e.message };
    return { ok: false, error: "เกิดข้อผิดพลาดในการค้นหาคำตอบ" };
  }
}
