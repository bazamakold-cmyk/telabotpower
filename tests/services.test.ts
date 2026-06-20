import { expect, test } from "vitest";
import { getKpis } from "@/lib/services/stats";
import { getTickets } from "@/lib/services/tickets";
import { getUsers } from "@/lib/services/users";

test("getTickets returns the mock tickets", async () => {
  const tickets = await getTickets();
  expect(tickets.length).toBeGreaterThanOrEqual(10);
  expect(tickets[0]).toHaveProperty("urgency");
});

test("getUsers returns mock users with roles", async () => {
  const users = await getUsers();
  expect(users.length).toBeGreaterThanOrEqual(6);
  expect(users.some((u) => u.role === "SUPER_ADMIN")).toBe(true);
});

test("getKpis returns 4 numeric fields", async () => {
  const k = await getKpis();
  for (const v of [k.avgResponseMin, k.aiQualityScore, k.working, k.done]) {
    expect(typeof v).toBe("number");
  }
});
