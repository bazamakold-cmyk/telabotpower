import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getTickets } from "@/lib/services/tickets";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const tickets = await getTickets();
  const working = tickets.filter((t) => t.status === "WORKING").length;
  return (
    <AppShell ticketBadge={working} userName={user.name}>
      {children}
    </AppShell>
  );
}
