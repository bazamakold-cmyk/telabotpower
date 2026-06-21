"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { indexDoc } from "@/lib/ingest";
import { requireRole } from "@/lib/session";
import { USE_MOCK } from "@/lib/use-mock";

type ReindexResult =
  | { ok: true; indexed: number; failed: number }
  | { ok: false; error: string };

async function canManage() {
  return (await requireRole(["SUPER_ADMIN", "MANAGER"])) !== null;
}

/** Build embeddings for every doc in a collection (used after adding keys / new docs). */
export async function reindexCollection(collectionId: string): Promise<ReindexResult> {
  if (!(await canManage())) return { ok: false, error: "ไม่มีสิทธิ์" };
  if (!collectionId) return { ok: false, error: "ไม่พบรหัสหมวดหมู่" };
  if (USE_MOCK) return { ok: true, indexed: 0, failed: 0 };

  const docs = await db.knowledgeDoc.findMany({
    where: { collectionId },
    select: { id: true },
  });

  let indexed = 0;
  let failed = 0;
  let lastError = "";
  for (const d of docs) {
    const r = await indexDoc(d.id);
    if (r.ok) indexed++;
    else {
      failed++;
      lastError = r.error;
    }
  }

  revalidatePath("/knowledge");
  // If nothing indexed and we have a reason, surface it (commonly: missing API key).
  if (indexed === 0 && failed > 0) return { ok: false, error: lastError };
  return { ok: true, indexed, failed };
}
