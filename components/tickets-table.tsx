"use client";

import { Eye, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { OnlineDot } from "@/components/online-dot";
import { ResponsiveTable, type Column } from "@/components/responsive-table";
import { RichTextEditor } from "@/components/rich-text-editor";
import { EmptyState } from "@/components/states";
import { StatusTag } from "@/components/status-tag";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const emptyDraft = (): Ticket => ({
  id: "",
  group: "",
  admin: "",
  adminOnline: true,
  tag: "",
  detail: "",
  urgency: "NORMAL",
  status: "WORKING",
  createdAt: "",
});

export function TicketsTable({ tickets: initial }: { tickets: Ticket[] }) {
  const [tickets, setTickets] = useState(initial);
  const [urgency, setUrgency] = useState<UrgencyFilter>("ALL");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [draft, setDraft] = useState<Ticket | null>(null);
  const [viewing, setViewing] = useState<Ticket | null>(null);

  const groupNames = useMemo(
    () => Array.from(new Set(tickets.map((t) => t.group))).filter(Boolean),
    [tickets]
  );

  function toggleStatus(id: string) {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: t.status === "WORKING" ? "DONE" : "WORKING" } : t
      )
    );
    toast.success("ปรับสถานะแล้ว (จำลอง)");
  }

  function addTicket() {
    if (!draft) return;
    const id = `TK-${1043 + tickets.length}`;
    setTickets((prev) => [{ ...draft, id, createdAt: new Date().toISOString() }, ...prev]);
    toast.success("เพิ่มงานแล้ว (จำลอง)");
    setDraft(null);
  }

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
    {
      key: "actions",
      header: "จัดการ",
      render: (r) => (
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            aria-label="ดูรายละเอียด"
            onClick={() => setViewing(r)}
          >
            <Eye className="size-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => toggleStatus(r.id)}>
            {r.status === "WORKING" ? "ทำเสร็จ" : "กลับมาทำ"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
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
        <Button onClick={() => setDraft(emptyDraft())}>
          <Plus className="size-4" /> เพิ่มงาน
        </Button>
      </div>

      <ResponsiveTable
        columns={columns}
        data={filtered}
        getRowKey={(r) => r.id}
        empty={<EmptyState title="ไม่พบงานตามตัวกรอง" description="ลองปรับตัวกรองใหม่" />}
      />

      <Dialog open={draft !== null} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          {draft && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                addTicket();
              }}
            >
              <DialogHeader>
                <DialogTitle>เพิ่มงานใหม่</DialogTitle>
                <DialogDescription>บันทึกงาน/ปัญหาที่รับเรื่องจาก Telegram</DialogDescription>
              </DialogHeader>

              <div className="space-y-1.5">
                <Label htmlFor="t-group">กลุ่ม</Label>
                <Select
                  value={draft.group}
                  onValueChange={(v) => setDraft((d) => (d ? { ...d, group: v ?? "" } : d))}
                >
                  <SelectTrigger id="t-group">
                    <SelectValue placeholder="เลือกกลุ่ม" />
                  </SelectTrigger>
                  <SelectContent>
                    {groupNames.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="t-admin">แอดมินผู้รับเรื่อง</Label>
                <Input
                  id="t-admin"
                  required
                  value={draft.admin}
                  onChange={(e) => setDraft((d) => (d ? { ...d, admin: e.target.value } : d))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="t-tag">เรื่องที่แจ้ง</Label>
                <Input
                  id="t-tag"
                  required
                  value={draft.tag}
                  onChange={(e) => setDraft((d) => (d ? { ...d, tag: e.target.value } : d))}
                  placeholder="เช่น สินค้าชำรุด"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="t-urgency">ความเร่งด่วน</Label>
                  <Select
                    value={draft.urgency}
                    onValueChange={(v) =>
                      setDraft((d) => (d ? { ...d, urgency: v as Urgency } : d))
                    }
                  >
                    <SelectTrigger id="t-urgency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HIGH">เร่งด่วนมาก</SelectItem>
                      <SelectItem value="MEDIUM">ปานกลาง</SelectItem>
                      <SelectItem value="NORMAL">ปกติ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="t-status">สถานะ</Label>
                  <Select
                    value={draft.status}
                    onValueChange={(v) =>
                      setDraft((d) => (d ? { ...d, status: v as TicketStatus } : d))
                    }
                  >
                    <SelectTrigger id="t-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WORKING">กำลังทำ</SelectItem>
                      <SelectItem value="DONE">เสร็จแล้ว</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>รายละเอียด</Label>
                <RichTextEditor
                  value={draft.detail ?? ""}
                  onChange={(html) => setDraft((d) => (d ? { ...d, detail: html } : d))}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
                  ยกเลิก
                </Button>
                <Button type="submit">บันทึก</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={viewing !== null} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>รายละเอียดงาน {viewing?.id}</DialogTitle>
            <DialogDescription>{viewing?.tag}</DialogDescription>
          </DialogHeader>
          {viewing?.detail ? (
            <div
              className="max-w-none text-sm [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: viewing.detail }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">ยังไม่มีรายละเอียด</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
