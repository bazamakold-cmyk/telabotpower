import { db } from "@/lib/db";
import { mockUsers } from "@/lib/mock/users";
import type { User } from "@/lib/types";
import { delay, USE_MOCK } from "@/lib/use-mock";

export async function getUsers(): Promise<User[]> {
  if (USE_MOCK) {
    await delay(120);
    return mockUsers;
  }
  const rows = await db.user.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map((u) => ({
    id: u.id,
    name: u.name,
    role: u.role,
    username: u.username ?? undefined,
    telegramId: u.telegramId ?? undefined,
    pinOnline: false, // real online status arrives in Phase 7 (Redis heartbeat)
    isActive: u.isActive,
  }));
}
