import type { Kpis, ResponseTrendPoint } from "@/lib/types";

export const mockKpis: Kpis = {
  avgResponseMin: 2.4,
  aiQualityScore: 8.7,
  working: 12,
  done: 148,
};

export const mockResponseTrend: ResponseTrendPoint[] = [
  { label: "7 มิ.ย.", minutes: 3.8 },
  { label: "8 มิ.ย.", minutes: 3.5 },
  { label: "9 มิ.ย.", minutes: 4.1 },
  { label: "10 มิ.ย.", minutes: 3.2 },
  { label: "11 มิ.ย.", minutes: 2.9 },
  { label: "12 มิ.ย.", minutes: 3.0 },
  { label: "13 มิ.ย.", minutes: 2.7 },
  { label: "14 มิ.ย.", minutes: 2.6 },
  { label: "15 มิ.ย.", minutes: 2.8 },
  { label: "16 มิ.ย.", minutes: 2.5 },
  { label: "17 มิ.ย.", minutes: 2.3 },
  { label: "18 มิ.ย.", minutes: 2.6 },
  { label: "19 มิ.ย.", minutes: 2.4 },
  { label: "20 มิ.ย.", minutes: 2.4 },
];
