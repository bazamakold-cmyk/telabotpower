import { CheckCircle2, Clock, Loader, MessageSquare, Sparkles, ThumbsDown } from "lucide-react";
import { AdminLivePanel } from "@/components/admin-live-panel";
import { KpiCard } from "@/components/kpi-card";
import { OnlineDot } from "@/components/online-dot";
import { ResponseTrendChart } from "@/components/response-trend-chart";
import { ResponsiveTable, type Column } from "@/components/responsive-table";
import { StatusTag } from "@/components/status-tag";
import { UrgencyTag } from "@/components/urgency-tag";
import { getFeedbackStats } from "@/lib/actions/feedback";
import { getKpis, getResponseTrend } from "@/lib/services/stats";
import { getTickets } from "@/lib/services/tickets";
import { getUsers } from "@/lib/services/users";
import type { Ticket } from "@/lib/types";

const columns: Column<Ticket>[] = [
  { key: "id", header: "ID งาน", className: "font-mono", render: (r) => r.code ?? r.id },
  { key: "group", header: "กลุ่ม" },
  {
    key: "admin",
    header: "แอดมิน",
    render: (r) => (
      <span className="inline-flex items-center gap-2">
        {r.admin}
        <OnlineDot online={r.adminOnline} />
      </span>
    ),
  },
  { key: "urgency", header: "ความเร่งด่วน", render: (r) => <UrgencyTag urgency={r.urgency} /> },
  { key: "status", header: "สถานะ", render: (r) => <StatusTag status={r.status} /> },
];

export default async function DashboardPage() {
  const [kpis, trend, tickets, users, feedback] = await Promise.all([
    getKpis(),
    getResponseTrend(),
    getTickets(),
    getUsers(),
    getFeedbackStats(),
  ]);
  const thumbsUpPct =
    feedback.total > 0 ? Math.round((feedback.thumbsUp / feedback.total) * 100) : 0;
  const recent = tickets.slice(0, 5);
  const admins = users.filter((u) => u.role !== "SUPER_ADMIN").slice(0, 3);

  return (
    <main className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-[0.2em] text-primary">DASHBOARD</p>
        <h1 className="font-display text-2xl font-bold">แดชบอร์ดภาพรวม</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="เวลาเฉลี่ยการตอบกลับ"
          value={String(kpis.avgResponseMin)}
          unit="นาที"
          icon={Clock}
          delta={{ label: "12%", tone: "good", dir: "down" }}
        />
        <KpiCard
          label="AI ตอบทั้งหมด"
          value={String(feedback.total)}
          unit="ครั้ง"
          icon={MessageSquare}
        />
        <KpiCard
          label="👍 พอใจ"
          value={feedback.total > 0 ? `${thumbsUpPct}%` : "—"}
          unit={feedback.total > 0 ? `(${feedback.thumbsUp}/${feedback.total})` : ""}
          icon={Sparkles}
          delta={
            feedback.total > 0
              ? { label: `👎 ${feedback.thumbsDown}`, tone: feedback.thumbsDown > 0 ? "bad" : "good", dir: "up" }
              : undefined
          }
        />
        <KpiCard
          label="งานสำเร็จ (Done) วันนี้"
          value={String(kpis.done)}
          icon={CheckCircle2}
          delta={{ label: "9%", tone: "good", dir: "up" }}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ResponseTrendChart data={trend} />
        </div>
        <AdminLivePanel admins={admins} sla={86} />
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">งานล่าสุด</h2>
        <ResponsiveTable columns={columns} data={recent} getRowKey={(r) => r.id} />
      </section>

      {feedback.recent.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <ThumbsDown className="size-4 text-danger" aria-hidden />
            คำถามที่ AI ตอบไม่ดี — ควรเพิ่มข้อมูลในคลังความรู้
          </h2>
          <div className="glass rounded-xl divide-y divide-border">
            {feedback.recent.map((r) => (
              <div key={r.id} className="flex flex-col gap-0.5 px-4 py-3 text-sm">
                <span className="font-medium">{r.question}</span>
                <span className="text-xs text-muted-foreground">
                  คลัง: {r.collectionName} · ความมั่นใจ {Math.round(r.confidence * 100)}%
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
