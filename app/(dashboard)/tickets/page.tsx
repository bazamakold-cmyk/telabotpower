import { TicketsTable } from "@/components/tickets-table";
import { getTickets } from "@/lib/services/tickets";

// mock: แอดมินที่กำลังเข้าสู่ระบบ (จะแทนด้วย session จริงในเฟส 4)
const CURRENT_ADMIN = "สมชาย ใจดี";

export default async function TicketsPage() {
  const tickets = await getTickets();
  return (
    <main className="space-y-6">
      <h1 className="font-display text-2xl font-bold">รายงานงาน &amp; ปัญหา</h1>
      <TicketsTable tickets={tickets} currentAdmin={CURRENT_ADMIN} />
    </main>
  );
}
