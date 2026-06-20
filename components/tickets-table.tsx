"use client";

import { useMemo, useState } from "react";
import { OnlineDot } from "@/components/online-dot";
import { ResponsiveTable, type Column } from "@/components/responsive-table";
import { EmptyState } from "@/components/states";
import { StatusTag } from "@/components/status-tag";
import { Button } from "@/components/ui/button";
import { UrgencyTag } from "@/components/urgency-tag";
import type { Ticket, TicketStatus, Urgency } from "@/lib/types";

type UrgencyFilter = Urgency | "ALL";
type StatusFilter = TicketStatus | "ALL";

function FilterGroup<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: [T, string][];
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg border p-1">
      <span className="px-2 text-xs text-muted-foreground">{label}</span>
      {options.map(([val, text]) => (
        <Button
          key={val}
          type="button"
          size="sm"
          variant={value === val ? "default" : "ghost"}
          className="h-7 px-2 text-xs"
          onClick={() => onChange(val)}
        >
          {text}
        </Button>
      ))}
    </div>
  );
}

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
  { key: "tag", header: "เรื่องที่แจ้ง" },
  { key: "urgency", header: "ความเร่งด่วน", render: (r) => <UrgencyTag urgency={r.urgency} /> },
  { key: "status", header: "สถานะ", render: (r) => <StatusTag status={r.status} /> },
];

export function TicketsTable({ tickets }: { tickets: Ticket[] }) {
  const [urgency, setUrgency] = useState<UrgencyFilter>("ALL");
  const [status, setStatus] = useState<StatusFilter>("ALL");

  const filtered = useMemo(
    () =>
      tickets
        .filter(
          (t) =>
            (urgency === "ALL" || t.urgency === urgency) &&
            (status === "ALL" || t.status === status)
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [tickets, urgency, status]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <FilterGroup<UrgencyFilter>
          label="ความเร่งด่วน"
          value={urgency}
          onChange={setUrgency}
          options={[
            ["ALL", "ทั้งหมด"],
            ["HIGH", "เร่งด่วนมาก"],
            ["MEDIUM", "ปานกลาง"],
            ["NORMAL", "ปกติ"],
          ]}
        />
        <FilterGroup<StatusFilter>
          label="สถานะ"
          value={status}
          onChange={setStatus}
          options={[
            ["ALL", "ทั้งหมด"],
            ["WORKING", "กำลังทำ"],
            ["DONE", "เสร็จแล้ว"],
          ]}
        />
      </div>
      <ResponsiveTable
        columns={columns}
        data={filtered}
        getRowKey={(r) => r.id}
        empty={<EmptyState title="ไม่พบงานตามตัวกรอง" description="ลองปรับตัวกรองใหม่" />}
      />
    </div>
  );
}
