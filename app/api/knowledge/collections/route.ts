import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({ name: z.string().min(1), description: z.string().optional() });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const c = await db.knowledgeCollection.create({
    data: { name: parsed.data.name, description: parsed.data.description || null },
  });
  return NextResponse.json({ id: c.id });
}
