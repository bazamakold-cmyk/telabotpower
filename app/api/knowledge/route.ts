import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const faqSchema = z.object({
  collectionId: z.string().min(1),
  question: z.string().min(1),
  answer: z.string().min(1),
});

export async function POST(req: Request) {
  const parsed = faqSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const d = parsed.data;
  const doc = await db.knowledgeDoc.create({
    data: {
      collectionId: d.collectionId,
      type: "FAQ",
      title: d.question,
      question: d.question,
      answer: d.answer,
      status: "READY",
    },
  });
  return NextResponse.json({ id: doc.id });
}
