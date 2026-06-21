import { randomUUID } from "node:crypto";
import { AiConfigError, embedTexts, getAiSettings, toVectorLiteral } from "@/lib/ai";
import { db } from "@/lib/db";

/**
 * Ingest core (NOT a server action — no "use server").
 * Only call from already-authenticated contexts (server actions that ran requireRole).
 * Keeping it out of a "use server" module prevents it from becoming an unauthenticated
 * RPC endpoint that could burn embedding/LLM quota.
 */

export type IndexResult = { ok: true; chunks: number } | { ok: false; error: string };

type IndexableDoc = {
  type: "FILE" | "FAQ";
  title: string;
  question: string | null;
  answer: string | null;
};

/** Split long text into ~1000-char chunks on paragraph boundaries. */
export function chunkText(text: string, maxLen = 1000): string[] {
  const clean = text.replace(/\r\n/g, "\n").trim();
  if (!clean) return [];
  if (clean.length <= maxLen) return [clean];

  const chunks: string[] = [];
  let cur = "";
  for (const para of clean.split(/\n{2,}/)) {
    const candidate = cur ? `${cur}\n\n${para}` : para;
    if (candidate.length > maxLen && cur) {
      chunks.push(cur.trim());
      cur = para;
    } else {
      cur = candidate;
    }
    while (cur.length > maxLen) {
      chunks.push(cur.slice(0, maxLen).trim());
      cur = cur.slice(maxLen);
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks;
}

/** Build the text chunks to embed for a doc. FAQ → Q/A pair; otherwise the answer text. */
export function buildChunks(doc: IndexableDoc): string[] {
  if (doc.type === "FAQ" && doc.question && doc.answer) {
    return [`คำถาม: ${doc.question}\nคำตอบ: ${doc.answer}`];
  }
  if (doc.answer?.trim()) {
    return chunkText(`${doc.title}\n\n${doc.answer}`);
  }
  return []; // e.g. a FILE doc whose contents aren't parsed yet (file ingest is a later phase)
}

/**
 * (Re)build embeddings for one doc: embed its chunks, replace its KnowledgeChunk rows,
 * and move its status PROCESSING → READY (or FAILED on a real error, PENDING if keys missing).
 */
export async function indexDoc(docId: string): Promise<IndexResult> {
  const doc = await db.knowledgeDoc.findUnique({ where: { id: docId } });
  if (!doc) return { ok: false, error: "ไม่พบเอกสาร" };

  const chunks = buildChunks(doc);
  if (chunks.length === 0) {
    return { ok: false, error: "เอกสารนี้ยังไม่มีเนื้อหาให้ทำดัชนี (ตอนนี้รองรับ FAQ ก่อน)" };
  }

  try {
    const settings = await getAiSettings();
    await db.knowledgeDoc.update({ where: { id: docId }, data: { status: "PROCESSING" } });
    const vectors = await embedTexts(chunks, "document", settings.embedModel);

    await db.$transaction(async (tx) => {
      await tx.knowledgeChunk.deleteMany({ where: { docId } });
      for (let i = 0; i < chunks.length; i++) {
        await tx.$executeRaw`
          INSERT INTO "KnowledgeChunk" ("id", "docId", "collectionId", "content", "embedding", "createdAt")
          VALUES (${randomUUID()}, ${docId}, ${doc.collectionId}, ${chunks[i]}, ${toVectorLiteral(
            vectors[i]
          )}::vector, now())
        `;
      }
    });

    await db.knowledgeDoc.update({ where: { id: docId }, data: { status: "READY" } });
    return { ok: true, chunks: chunks.length };
  } catch (e) {
    const isConfig = e instanceof AiConfigError;
    // Config error (no API key yet) → leave as PENDING so the user can retry after adding keys.
    // Any other error → FAILED.
    await db.knowledgeDoc
      .update({ where: { id: docId }, data: { status: isConfig ? "PENDING" : "FAILED" } })
      .catch(() => {});
    return { ok: false, error: e instanceof Error ? e.message : "สร้างดัชนีไม่สำเร็จ" };
  }
}
