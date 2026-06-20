import { TicketsTable } from "@/components/tickets-table";
import { getTickets } from "@/lib/services/tickets";

export default async function TicketsPage() {
  const tickets = await getTickets();
  return (
    <main className="space-y-6">
      <h1 className="font-display text-2xl font-bold">รายงานงาน &amp; ปัญหา</h1>
      <TicketsTable tickets={tickets} />
    </main>
  );
}
