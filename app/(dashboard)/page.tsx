import { CheckCircle2, Clock, Loader, Sparkles } from "lucide-react";
import { OnlineDot } from "@/components/online-dot";
import { ResponsiveTable, type Column } from "@/components/responsive-table";
import { StatusTag } from "@/components/status-tag";
import { UrgencyTag } from "@/components/urgency-tag";
import type { TicketStatus, Urgency } from "@/lib/tags";

const kpis = [
  { label: "เวลาเฉลี่ยการตอบกลับ", value: "2.4 นาที", icon: Clock },
  { label: "คะแนน AI ประเมินคุณภาพ", value: "8.7 / 10", icon: Sparkles },
  { label: "งานสะสม (Working)", value: "12", icon: Loader },
  { label: "งานสำเร็จ (Done)", value: "148", icon: CheckCircle2 },
];

type Row = {
  id: string;
  group: string;
  admin: string;
  online: boolean;
  urgency: Urgency;
  status: TicketStatus;
};

const rows: Row[] = [
  { id: "TK-1042", group: "ลูกค้า VIP", admin: "สมชาย", online: true, urgency: "HIGH", status: "WORKING" },
  { id: "TK-1041", group: "ซัพพอร์ตทั่วไป", admin: "อรพิน", online: false, urgency: "MEDIUM", status: "DONE" },
  { id: "TK-1040", group: "ฝ่ายขาย", admin: "วิภา", online: true, urgency: "NORMAL", status: "DONE" },
];

const columns: Column<Row>[] = [
  { key: "id", header: "ID งาน", className: "font-mono" },
  { key: "group", header: "กลุ่ม" },
  {
    key: "admin",
    header: "แอดมิน",
    render: (r) => (
      <span className="inline-flex items-center gap-2">
        {r.admin}
        <OnlineDot online={r.online} />
      </span>
    ),
  },
  { key: "urgency", header: "ความเร่งด่วน", render: (r) => <UrgencyTag urgency={r.urgency} /> },
  { key: "status", header: "สถานะ", render: (r) => <StatusTag status={r.status} /> },
];

export default function DashboardPage() {
  return (
    <main className="space-y-6">
      <h1 className="font-display text-2xl font-bold">แดชบอร์ดภาพรวม</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="glass rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{k.label}</span>
                <Icon className="size-4 text-primary" aria-hidden />
              </div>
              <p className="mt-2 font-display text-2xl font-bold tabular-nums">{k.value}</p>
            </div>
          );
        })}
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">งานล่าสุด</h2>
        <ResponsiveTable columns={columns} data={rows} getRowKey={(r) => r.id} />
      </section>
    </main>
  );
}
