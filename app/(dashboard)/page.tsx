import { CheckCircle2, Clock, Loader, Sparkles } from "lucide-react";
import { AdminLivePanel } from "@/components/admin-live-panel";
import { KpiCard } from "@/components/kpi-card";
import { OnlineDot } from "@/components/online-dot";
import { ResponseTrendChart } from "@/components/response-trend-chart";
import { ResponsiveTable, type Column } from "@/components/responsive-table";
import { StatusTag } from "@/components/status-tag";
import { UrgencyTag } from "@/components/urgency-tag";
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
  const [kpis, trend, tickets, users] = await Promise.all([
    getKpis(),
    getResponseTrend(),
    getTickets(),
    getUsers(),
  ]);
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
          label="คะแนน AI ประเมินคุณภาพ"
          value={String(kpis.aiQualityScore)}
          unit="/10"
          icon={Sparkles}
          delta={{ label: "4%", tone: "good", dir: "up" }}
        />
        <KpiCard
          label="งานสะสม (Working)"
          value={String(kpis.working)}
          icon={Loader}
          delta={{ label: "5", tone: "bad", dir: "up" }}
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
    </main>
  );
}
