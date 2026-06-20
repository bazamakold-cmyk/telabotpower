import { mockGroups } from "@/lib/mock/groups";
import type { TelegramGroup } from "@/lib/types";
import { delay, USE_MOCK } from "@/lib/use-mock";

export async function getGroups(): Promise<TelegramGroup[]> {
  if (USE_MOCK) {
    await delay(120);
    return mockGroups;
  }
  const res = await fetch("/api/groups");
  return (await res.json()) as TelegramGroup[];
}
