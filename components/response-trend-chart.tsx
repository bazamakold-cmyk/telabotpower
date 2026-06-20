"use client";

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ResponseTrendPoint } from "@/lib/types";

export function ResponseTrendChart({ data }: { data: ResponseTrendPoint[] }) {
  return (
    <div className="glass relative overflow-hidden rounded-xl p-4">
      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-primary">
          TREND · 7 วัน
        </span>
        <h2 className="font-display font-semibold">แนวโน้มเวลาการตอบของแอดมิน</h2>
      </div>

      {data.length === 0 ? (
        <div className="grid h-64 place-items-center text-sm text-muted-foreground">
          ยังไม่มีข้อมูล
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="left"
                width={44}
                unit=" น."
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis yAxisId="right" orientation="right" hide />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--popover-foreground)",
                }}
                labelStyle={{ color: "var(--muted-foreground)" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                yAxisId="right"
                dataKey="count"
                name="จำนวนงานเข้า"
                fill="var(--info)"
                fillOpacity={0.35}
                radius={[4, 4, 0, 0]}
                barSize={14}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="minutes"
                name="เวลาตอบเฉลี่ย (นาที)"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="url(#trendFill)"
                dot={{ r: 3, fill: "var(--primary)" }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
