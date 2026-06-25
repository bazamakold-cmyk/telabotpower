import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { db } from "@/lib/db";
import { getTickets } from "@/lib/services/tickets";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

async function getPendingCount(): Promise<number> {
  const groups = await db.telegramGroup.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  let count = 0;
  for (const g of groups) {
    const lastMsg = await db.chatMessage.findFirst({
      where: { groupId: g.id },
      orderBy: { sentAt: "desc" },
      select: { role: true },
    });
    if (lastMsg?.role === "CUSTOMER") count++;
  }
  return count;
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [tickets, draftCount, pendingCount] = await Promise.all([
    getTickets(),
    db.aiDraft.count({ where: { status: "PENDING" } }),
    getPendingCount(),
  ]);
  const working = tickets.filter((t) => t.status === "WORKING").length;
  return (
    <AppShell
      ticketBadge={working}
      draftBadge={draftCount}
      pendingBadge={pendingCount}
      userName={user.name}
      userRole={user.role}
    >
      {children}
    </AppShell>
  );
}
