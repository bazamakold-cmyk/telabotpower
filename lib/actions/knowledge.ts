"use server";

import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { indexDoc } from "@/lib/ingest";
import { requireRole } from "@/lib/session";
import { USE_MOCK } from "@/lib/use-mock";

type Result = { ok: true } | { ok: false; error: string };
type DeleteCollectionResult = { ok: true; deletedDocs: number } | { ok: false; error: string };

async function canManage() {
  return (await requireRole(["SUPER_ADMIN", "MANAGER"])) !== null;
}

export async function createCollection(
  name: string,
  description?: string
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!(await canManage())) return { ok: false, error: "ไม่มีสิทธิ์" };
  if (!name.trim()) return { ok: false, error: "กรุณากรอกชื่อหมวดหมู่" };
  if (USE_MOCK) return { ok: true, id: "" };
  const c = await db.knowledgeCollection.create({
    data: { name: name.trim(), description: description?.trim() || null },
  });
  revalidatePath("/knowledge");
  return { ok: true, id: c.id };
}

export async function createFaq(
  collectionId: string,
  question: string,
  answer: string
): Promise<Result> {
  if (!(await canManage())) return { ok: false, error: "ไม่มีสิทธิ์" };
  if (!collectionId || !question.trim() || !answer.trim()) {
    return { ok: false, error: "ข้อมูลไม่ครบ" };
  }
  if (USE_MOCK) return { ok: true };
  const doc = await db.knowledgeDoc.create({
    data: {
      collectionId,
      type: "FAQ",
      title: question.trim(),
      question: question.trim(),
      answer: answer.trim(),
      status: "PENDING",
    },
  });
  // Best-effort RAG indexing. If keys aren't set yet, indexDoc leaves the doc PENDING
  // (the FAQ is still saved) and it can be reindexed later from the UI.
  await indexDoc(doc.id);
  revalidatePath("/knowledge");
  return { ok: true };
}

export async function deleteDoc(id: string): Promise<Result> {
  if (!(await canManage())) return { ok: false, error: "ไม่มีสิทธิ์" };
  if (USE_MOCK) return { ok: true };
  try {
    await db.knowledgeDoc.delete({ where: { id } });
  } catch {
    return { ok: false, error: "ลบไม่สำเร็จ (อาจถูกลบไปแล้ว)" };
  }
  revalidatePath("/knowledge");
  return { ok: true };
}

const ALLOWED_EXT = [".txt", ".md"];

export async function uploadFile(formData: FormData): Promise<Result> {
  if (!(await canManage())) return { ok: false, error: "ไม่มีสิทธิ์" };

  const file = formData.get("file") as File | null;
  const collectionId = formData.get("collectionId") as string | null;
  if (!file || !collectionId) return { ok: false, error: "ข้อมูลไม่ครบ" };

  const lower = file.name.toLowerCase();
  if (!ALLOWED_EXT.some((ext) => lower.endsWith(ext))) {
    return { ok: false, error: "รองรับเฉพาะไฟล์ .txt และ .md" };
  }

  const text = await file.text();
  if (!text.trim()) return { ok: false, error: `ไฟล์ "${file.name}" ว่างเปล่า` };

  if (USE_MOCK) return { ok: true };

  try {
    const blob = await put(`knowledge/${collectionId}/${file.name}`, file, {
      access: "private",
      addRandomSuffix: true,
    });

    const doc = await db.knowledgeDoc.create({
      data: {
        collectionId,
        type: "FILE",
        title: file.name,
        blobUrl: blob.url,
        answer: text,
        status: "PENDING",
      },
    });

    await indexDoc(doc.id);
    revalidatePath("/knowledge");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ" };
  }
}

/**
 * Delete a knowledge collection (category) and — via the schema's
 * `onDelete: Cascade` — every document inside it.
 */
export async function deleteCollection(id: string): Promise<DeleteCollectionResult> {
  if (!id) return { ok: false, error: "ไม่พบรหัสหมวดหมู่" };
  if (!(await canManage())) return { ok: false, error: "ไม่มีสิทธิ์" };
  if (USE_MOCK) return { ok: true, deletedDocs: 0 };
  try {
    const deletedDocs = await db.knowledgeDoc.count({ where: { collectionId: id } });
    await db.knowledgeCollection.delete({ where: { id } });
    revalidatePath("/knowledge");
    return { ok: true, deletedDocs };
  } catch {
    return { ok: false, error: "ลบหมวดหมู่ไม่สำเร็จ (อาจถูกลบไปแล้ว)" };
  }
}
