import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const actor = await requireSuperAdmin().catch(() => null);
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const logs = await db.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: { user: { select: { name: true, role: true } } },
  });

  return NextResponse.json(logs);
}
