import { PendingChats } from "@/components/pending-chats";
import { db } from "@/lib/db";
import { requireAnyRole } from "@/lib/session";

export const dynamic = "force-dynamic";

async function getPendingChats() {
  const groups = await db.telegramGroup.findMany({
    where: { isActive: true },
    select: { id: true, name: true, chatId: true },
  });

  const results = await Promise.all(
    groups.map(async (g) => {
      const lastMsg = await db.chatMessage.findFirst({
        where: { groupId: g.id },
        orderBy: { sentAt: "desc" },
      });

      if (!lastMsg || lastMsg.role !== "CUSTOMER") return null;

      const lastReply = await db.chatMessage.findFirst({
        where: { groupId: g.id, role: { in: ["ADMIN", "BOT"] } },
        orderBy: { sentAt: "desc" },
      });

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

  return results.filter(Boolean) as NonNullable<(typeof results)[number]>[];
}

export default async function PendingPage() {
  await requireAnyRole();
  const pending = await getPendingChats();

  return (
    <main className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">แชทค้าง</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          กลุ่มที่ลูกค้าส่งข้อความมาแล้วยังไม่มีใครตอบกลับ — อัปเดตอัตโนมัติทุก 60 วินาที
        </p>
      </div>
      <PendingChats initial={pending} />
    </main>
  );
}
