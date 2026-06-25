import { db } from "@/lib/db";
import type { Kpis, ResponseTrendPoint } from "@/lib/types";

/** Average minutes from first CUSTOMER message to first BOT/ADMIN reply, last 30 days. */
async function getAvgResponseMin(): Promise<number> {
  const rows = await db.$queryRaw<{ avg_min: number | null }[]>`
    SELECT AVG(EXTRACT(EPOCH FROM (r."sentAt" - c."sentAt")) / 60) AS avg_min
    FROM "ChatMessage" c
    CROSS JOIN LATERAL (
      SELECT "sentAt"
      FROM "ChatMessage" r2
      WHERE r2."groupId" = c."groupId"
        AND r2."sentAt" > c."sentAt"
        AND r2."role" IN ('BOT', 'ADMIN')
      ORDER BY r2."sentAt" ASC
      LIMIT 1
    ) r
    WHERE c."role" = 'CUSTOMER'
      AND c."sentAt" >= NOW() - INTERVAL '30 days'
      AND c."sentAt" < NOW()
  `;
  const v = rows[0]?.avg_min;
  return v != null ? Math.round(Number(v)) : 0;
}

export async function getKpis(): Promise<Kpis> {
  const [working, done, avgResponseMin, totalRated, thumbsUp] = await Promise.all([
    db.ticket.count({ where: { status: "WORKING" } }),
    db.ticket.count({ where: { status: "DONE" } }),
    getAvgResponseMin(),
    db.answerLog.count({ where: { rating: { not: null } } }),
    db.answerLog.count({ where: { rating: 1 } }),
  ]);

  const aiQualityScore = totalRated > 0 ? Math.round((thumbsUp / totalRated) * 100) : 0;

  return { avgResponseMin, aiQualityScore, working, done };
}

export async function getResponseTrend(): Promise<ResponseTrendPoint[]> {
  const rows = await db.$queryRaw<{ day: Date; count: bigint; avg_min: number | null }[]>`
    SELECT
      DATE_TRUNC('day', c."sentAt" AT TIME ZONE 'Asia/Bangkok') AS day,
      COUNT(DISTINCT c.id)                                       AS count,
      AVG(EXTRACT(EPOCH FROM (r."sentAt" - c."sentAt")) / 60)   AS avg_min
    FROM "ChatMessage" c
    CROSS JOIN LATERAL (
      SELECT "sentAt"
      FROM "ChatMessage" r2
      WHERE r2."groupId" = c."groupId"
        AND r2."sentAt" > c."sentAt"
        AND r2."role" IN ('BOT', 'ADMIN')
      ORDER BY r2."sentAt" ASC
      LIMIT 1
    ) r
    WHERE c."role" = 'CUSTOMER'
      AND c."sentAt" >= NOW() - INTERVAL '7 days'
    GROUP BY day
    ORDER BY day ASC
  `;

  // Fill all 7 days — compare as Bangkok date strings to match DATE_TRUNC AT TIME ZONE
  const toDateKey = (d: Date) =>
    d.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }); // "YYYY-MM-DD"

  const rowMap = new Map(rows.map((r) => [toDateKey(new Date(r.day)), r]));

  const result: ResponseTrendPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = toDateKey(d);
    const row = rowMap.get(key);

    result.push({
      label: d.toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", weekday: "short", day: "numeric" }),
      count: row ? Number(row.count) : 0,
      minutes: row?.avg_min != null ? Math.round(Number(row.avg_min)) : 0,
    });
  }
  return result;
}
