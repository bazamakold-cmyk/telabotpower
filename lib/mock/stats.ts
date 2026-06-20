import type { Kpis, ResponseTrendPoint } from "@/lib/types";

export const mockKpis: Kpis = {
  avgResponseMin: 2.4,
  aiQualityScore: 8.7,
  working: 12,
  done: 148,
};

export const mockResponseTrend: ResponseTrendPoint[] = [
  { label: "จ", minutes: 3.8, count: 52 },
  { label: "อ", minutes: 3.5, count: 61 },
  { label: "พ", minutes: 4.1, count: 48 },
  { label: "พฤ", minutes: 3.2, count: 73 },
  { label: "ศ", minutes: 2.9, count: 66 },
  { label: "ส", minutes: 3.0, count: 58 },
  { label: "อา", minutes: 2.7, count: 70 },
];
