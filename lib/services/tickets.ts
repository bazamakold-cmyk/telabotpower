import { db } from "@/lib/db";
import { mockTickets } from "@/lib/mock/tickets";
import { formatTicketCode } from "@/lib/ticket-code";
import type { Ticket } from "@/lib/types";
import { delay, USE_MOCK } from "@/lib/use-mock";

export async function getTickets(): Promise<Ticket[]> {
  if (USE_MOCK) {
    await delay(120);
    return mockTickets;
  }
  const rows = await db.ticket.findMany({
    include: { group: { select: { name: true } }, admin: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((t) => ({
    id: t.id,
    code: formatTicketCode(t.seq),
    group: t.group?.name ?? "—",
    admin: t.admin?.name ?? "—",
    adminOnline: false,
    tag: t.tag,
    detail: t.detail ?? undefined,
    urgency: t.urgency,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
  }));
}
