import { db } from "@/lib/db";
import { mockKpis, mockResponseTrend } from "@/lib/mock/stats";
import type { Kpis, ResponseTrendPoint } from "@/lib/types";
import { delay, USE_MOCK } from "@/lib/use-mock";

export async function getKpis(): Promise<Kpis> {
  if (USE_MOCK) {
    await delay(120);
    return mockKpis;
  }
  const [working, done] = await Promise.all([
    db.ticket.count({ where: { status: "WORKING" } }),
    db.ticket.count({ where: { status: "DONE" } }),
  ]);
  // avgResponseMin + aiQualityScore are computed from chat analysis in Phase 5/6.
  return { avgResponseMin: mockKpis.avgResponseMin, aiQualityScore: mockKpis.aiQualityScore, working, done };
}

export async function getResponseTrend(): Promise<ResponseTrendPoint[]> {
  if (USE_MOCK) {
    await delay(120);
    return mockResponseTrend;
  }
  // Real trend is derived from ChatMessage timings in Phase 5.
  return mockResponseTrend;
}
