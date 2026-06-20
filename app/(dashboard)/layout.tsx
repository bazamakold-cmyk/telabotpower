import { AppShell } from "@/components/app-shell";
import { getTickets } from "@/lib/services/tickets";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const tickets = await getTickets();
  const working = tickets.filter((t) => t.status === "WORKING").length;
  return <AppShell ticketBadge={working}>{children}</AppShell>;
}
