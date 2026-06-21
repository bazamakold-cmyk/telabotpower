"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { USE_MOCK } from "@/lib/use-mock";

type ActionResult = { ok: true; deletedDocs: number } | { ok: false; error: string };

/**
 * Delete a knowledge collection (category) and — via the schema's
 * `onDelete: Cascade` — every document inside it. Real DB write.
 */
export async function deleteCollection(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "ไม่พบรหัสหมวดหมู่" };

  try {
    await requireUser();
  } catch {
    return { ok: false, error: "กรุณาเข้าสู่ระบบก่อนลบ" };
  }

  // Mock mode: pretend success without touching the database.
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
