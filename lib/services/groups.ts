import { db } from "@/lib/db";
import { mockGroups } from "@/lib/mock/groups";
import type { TelegramGroup } from "@/lib/types";
import { delay, USE_MOCK } from "@/lib/use-mock";

export async function getGroups(): Promise<TelegramGroup[]> {
  if (USE_MOCK) {
    await delay(120);
    return mockGroups;
  }
  const rows = await db.telegramGroup.findMany({
    include: { collections: { select: { id: true } } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((g) => ({
    id: g.id,
    name: g.name,
    chatId: g.chatId,
    purpose: g.purpose ?? undefined,
    botMode: g.botMode,
    collectionIds: g.collections.map((c) => c.id),
    isActive: g.isActive,
  }));
}
