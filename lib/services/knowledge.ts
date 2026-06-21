import { db } from "@/lib/db";
import { mockCollections, mockDocs } from "@/lib/mock/knowledge";
import type { KnowledgeCollection, KnowledgeDoc } from "@/lib/types";
import { delay, USE_MOCK } from "@/lib/use-mock";

export async function getCollections(): Promise<KnowledgeCollection[]> {
  if (USE_MOCK) {
    await delay(120);
    return mockCollections;
  }
  const rows = await db.knowledgeCollection.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map((c) => ({ id: c.id, name: c.name, description: c.description ?? undefined }));
}

export async function getDocs(): Promise<KnowledgeDoc[]> {
  if (USE_MOCK) {
    await delay(120);
    return mockDocs;
  }
  const rows = await db.knowledgeDoc.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map((d) => ({
    id: d.id,
    collectionId: d.collectionId,
    type: d.type,
    title: d.title,
    question: d.question ?? undefined,
    answer: d.answer ?? undefined,
    status: d.status,
  }));
}
