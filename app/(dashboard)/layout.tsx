import { AppShell } from "@/components/app-shell";
import { getTickets } from "@/lib/services/tickets";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [tickets, user] = await Promise.all([getTickets(), getCurrentUser()]);
  const working = tickets.filter((t) => t.status === "WORKING").length;
  return (
    <AppShell ticketBadge={working} userName={user?.name}>
      {children}
    </AppShell>
  );
}
