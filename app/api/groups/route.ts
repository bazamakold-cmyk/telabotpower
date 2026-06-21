import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { groupCreateSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = groupCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const d = parsed.data;
  try {
    const group = await db.telegramGroup.create({
      data: {
        name: d.name,
        chatId: d.chatId,
        purpose: d.purpose || null,
        botMode: d.botMode,
        collections: { connect: d.collectionIds.map((id) => ({ id })) },
      },
    });
    return NextResponse.json({ id: group.id });
  } catch {
    return NextResponse.json({ error: "Chat ID ซ้ำ" }, { status: 409 });
  }
}
