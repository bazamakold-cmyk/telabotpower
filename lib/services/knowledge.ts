import { mockCollections, mockDocs } from "@/lib/mock/knowledge";
import type { KnowledgeCollection, KnowledgeDoc } from "@/lib/types";
import { delay, USE_MOCK } from "@/lib/use-mock";

export async function getCollections(): Promise<KnowledgeCollection[]> {
  if (USE_MOCK) {
    await delay(120);
    return mockCollections;
  }
  const res = await fetch("/api/knowledge/collections");
  return (await res.json()) as KnowledgeCollection[];
}

export async function getDocs(): Promise<KnowledgeDoc[]> {
  if (USE_MOCK) {
    await delay(120);
    return mockDocs;
  }
  const res = await fetch("/api/knowledge");
  return (await res.json()) as KnowledgeDoc[];
}
