import { TicketsTable } from "@/components/tickets-table";
import { getGroups } from "@/lib/services/groups";
import { getTickets } from "@/lib/services/tickets";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function TicketsPage() {
  const [tickets, groups, user] = await Promise.all([getTickets(), getGroups(), getCurrentUser()]);
  return (
    <main className="space-y-6">
      <h1 className="font-display text-2xl font-bold">รายงานงาน &amp; ปัญหา</h1>
      <TicketsTable tickets={tickets} groups={groups} currentAdmin={user?.name ?? "ฉัน"} />
    </main>
  );
}
