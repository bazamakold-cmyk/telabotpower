import { mockUsers } from "@/lib/mock/users";
import type { User } from "@/lib/types";
import { delay, USE_MOCK } from "@/lib/use-mock";

export async function getUsers(): Promise<User[]> {
  if (USE_MOCK) {
    await delay(120);
    return mockUsers;
  }
  const res = await fetch("/api/users");
  return (await res.json()) as User[];
}
