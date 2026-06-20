import { mockTickets } from "@/lib/mock/tickets";
import type { Ticket } from "@/lib/types";
import { delay, USE_MOCK } from "@/lib/use-mock";

export async function getTickets(): Promise<Ticket[]> {
  if (USE_MOCK) {
    await delay(120);
    return mockTickets;
  }
  const res = await fetch("/api/tickets");
  return (await res.json()) as Ticket[];
}
