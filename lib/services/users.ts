import { db } from "@/lib/db";
import { mockUsers } from "@/lib/mock/users";
import type { User } from "@/lib/types";
import { delay, USE_MOCK } from "@/lib/use-mock";

export async function getUsers(): Promise<User[]> {
  if (USE_MOCK) {
    await delay(120);
    return mockUsers;
  }
  const now = new Date();
  const [rows, activeSessions] = await Promise.all([
    db.user.findMany({ orderBy: { createdAt: "desc" } }),
    db.session.findMany({
      where: { expiresAt: { gt: now } },
      select: { userId: true },
    }),
  ]);
  const onlineIds = new Set(activeSessions.map((s) => s.userId));
  return rows.map((u) => ({
    id: u.id,
    name: u.name,
    role: u.role,
    username: u.username ?? undefined,
    telegramId: u.telegramId ?? undefined,
    pinOnline: onlineIds.has(u.id),
    isActive: u.isActive,
  }));
}
