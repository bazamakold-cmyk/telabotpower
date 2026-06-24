"use server";

import { AiConfigError } from "@/lib/ai";
import { ragAnswer, type RagSource } from "@/lib/rag";
import { getCurrentUser } from "@/lib/session";
import { USE_MOCK } from "@/lib/use-mock";

export type AskSource = RagSource;
export type AskResult =
  | { ok: true; answer: string; sources: AskSource[]; confidence: number }
  | { ok: false; error: string };

// แสดงผลทุกครั้งที่ hadContext=true, บล็อกเฉพาะ <30% (แทบไม่มีข้อมูลเลย)
const CONFIDENCE_THRESHOLD = 0.3;

const BREVITY_INSTRUCTION =
  "\n\nกรุณาตอบสั้น กระชับ ตรงประเด็น ไม่เกิน 5 ประโยค ห้ามใส่ข้อมูลที่ไม่เกี่ยวข้อง";

export async function askAssistant(collectionId: string, question: string): Promise<AskResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "กรุณาเข้าสู่ระบบ" };

  const q = question.trim();
  if (!collectionId) return { ok: false, error: "กรุณาเลือกคลังความรู้ก่อน" };
  if (!q) return { ok: false, error: "กรุณาพิมพ์คำถาม" };
  if (USE_MOCK) {
    return {
      ok: true,
      answer: "(โหมดจำลอง) ต่อ API key จริงเพื่อให้ AI ตอบจากคลังความรู้",
      sources: [],
      confidence: 0,
    };
  }

  try {
    const r = await ragAnswer({
      collectionIds: [collectionId],
      question: q,
      extraSystem: BREVITY_INSTRUCTION,
      maxTokens: 400,
    });

    if (!r.hadContext) {
      return {
        ok: true,
        answer:
          r.rowsFound === 0
            ? 'ยังไม่พบข้อมูลในคลังนี้ — อาจยังไม่ได้สร้างดัชนี (ไปที่หน้า "คลังความรู้" แล้วกด "สร้างดัชนี (RAG)")'
            : `ไม่พบข้อมูลที่ตรงพอ (ความมั่นใจสูงสุด ${Math.round((r.confidence ?? 0) * 100)}%) — ลองถามด้วยคำที่ตรงกับเอกสารมากขึ้น`,
        sources: [],
        confidence: r.confidence,
      };
    }

    if (r.confidence < CONFIDENCE_THRESHOLD) {
      return {
        ok: true,
        answer: `ข้อมูลที่ใกล้เคียงน้อยเกินไป (ความมั่นใจ ${Math.round(r.confidence * 100)}%) — ลองถามด้วยคำอื่น หรือเพิ่มข้อมูลในคลังความรู้`,
        sources: [],
        confidence: r.confidence,
      };
    }

    return {
      ok: true,
      answer: r.answer || "ขออภัย ไม่สามารถสร้างคำตอบได้ในขณะนี้",
      sources: r.sources,
      confidence: r.confidence,
    };
  } catch (e) {
    if (e instanceof AiConfigError) return { ok: false, error: e.message };
    return { ok: false, error: "เกิดข้อผิดพลาดในการค้นหาคำตอบ" };
  }
}
