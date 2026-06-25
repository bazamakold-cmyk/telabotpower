import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { db } from "@/lib/db";
import { getTickets } from "@/lib/services/tickets";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [tickets, draftCount] = await Promise.all([
    getTickets(),
    db.aiDraft.count({ where: { status: "PENDING" } }),
  ]);
  const working = tickets.filter((t) => t.status === "WORKING").length;
  return (
    <AppShell ticketBadge={working} draftBadge={draftCount} userName={user.name}>
      {children}
    </AppShell>
  );
}
