import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const u = await getCurrentUser();
  return NextResponse.json({ user: u ? { id: u.id, name: u.name, role: u.role } : null });
}
