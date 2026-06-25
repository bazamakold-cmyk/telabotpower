import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const drafts = await db.aiDraft.findMany({
    where: { status: "PENDING" },
    include: { group: { select: { id: true, name: true, chatId: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(drafts);
}
