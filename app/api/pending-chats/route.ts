import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAnyRole } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireAnyRole().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const groups = await db.telegramGroup.findMany({
    where: { isActive: true },
    select: { id: true, name: true, chatId: true },
  });

  const results = await Promise.all(
    groups.map(async (g) => {
      // Last message in this group (any role)
      const lastMsg = await db.chatMessage.findFirst({
        where: { groupId: g.id },
        orderBy: { sentAt: "desc" },
      });

      // Not pending if no messages or last message is from staff/bot
      if (!lastMsg || lastMsg.role !== "CUSTOMER") return null;

      // Last reply from ADMIN or BOT
      const lastReply = await db.chatMessage.findFirst({
        where: { groupId: g.id, role: { in: ["ADMIN", "BOT"] } },
        orderBy: { sentAt: "desc" },
      });

      // Count unread customer messages since last reply
      const pendingCount = await db.chatMessage.count({
        where: {
          groupId: g.id,
          role: "CUSTOMER",
          sentAt: { gt: lastReply?.sentAt ?? new Date(0) },
        },
      });

      const waitingSince = lastReply
        ? (await db.chatMessage.findFirst({
            where: { groupId: g.id, role: "CUSTOMER", sentAt: { gt: lastReply.sentAt } },
            orderBy: { sentAt: "asc" },
          }))?.sentAt ?? lastMsg.sentAt
        : lastMsg.sentAt;

      return {
        groupId: g.id,
        groupName: g.name,
        chatId: g.chatId,
        lastMessage: lastMsg.text,
        pendingCount,
        waitingSince: waitingSince.toISOString(),
      };
    }),
  );

  return NextResponse.json(results.filter(Boolean));
}
