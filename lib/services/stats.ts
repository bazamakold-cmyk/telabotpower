import { mockKpis, mockResponseTrend } from "@/lib/mock/stats";
import type { Kpis, ResponseTrendPoint } from "@/lib/types";
import { delay, USE_MOCK } from "@/lib/use-mock";

export async function getKpis(): Promise<Kpis> {
  if (USE_MOCK) {
    await delay(120);
    return mockKpis;
  }
  const res = await fetch("/api/stats");
  return (await res.json()) as Kpis;
}

export async function getResponseTrend(): Promise<ResponseTrendPoint[]> {
  if (USE_MOCK) {
    await delay(120);
    return mockResponseTrend;
  }
  const res = await fetch("/api/stats/trend");
  return (await res.json()) as ResponseTrendPoint[];
}
