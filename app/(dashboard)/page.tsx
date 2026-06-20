import { CheckCircle2, Clock, Loader, Sparkles } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { OnlineDot } from "@/components/online-dot";
import { ResponseTrendChart } from "@/components/response-trend-chart";
import { ResponsiveTable, type Column } from "@/components/responsive-table";
import { StatusTag } from "@/components/status-tag";
import { UrgencyTag } from "@/components/urgency-tag";
import { getKpis, getResponseTrend } from "@/lib/services/stats";
import { getTickets } from "@/lib/services/tickets";
import type { Ticket } from "@/lib/types";

const columns: Column<Ticket>[] = [
  { key: "id", header: "ID งาน", className: "font-mono" },
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
  const [kpis, trend, tickets] = await Promise.all([getKpis(), getResponseTrend(), getTickets()]);
  const recent = tickets.slice(0, 5);

  return (
    <main className="space-y-6">
      <h1 className="font-display text-2xl font-bold">แดชบอร์ดภาพรวม</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="เวลาเฉลี่ยการตอบกลับ" value={`${kpis.avgResponseMin} นาที`} icon={Clock} />
        <KpiCard label="คะแนน AI ประเมินคุณภาพ" value={`${kpis.aiQualityScore} / 10`} icon={Sparkles} />
        <KpiCard label="งานสะสม (Working)" value={String(kpis.working)} icon={Loader} />
        <KpiCard label="งานสำเร็จ (Done)" value={String(kpis.done)} icon={CheckCircle2} />
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">แนวโน้มเวลาการตอบกลับ</h2>
        <ResponseTrendChart data={trend} />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">งานล่าสุด</h2>
        <ResponsiveTable columns={columns} data={recent} getRowKey={(r) => r.id} />
      </section>
    </main>
  );
}
