"use client";

import { Eye, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-fetch";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import type { TelegramGroup, Ticket, TicketStatus, Urgency } from "@/lib/types";

type UrgencyFilter = Urgency | "ALL";
type StatusFilter = TicketStatus | "ALL";

const STATUS_OPTIONS: [TicketStatus, string][] = [
  ["RECEIVED", "รับเรื่อง"],
  ["WORKING", "กำลังทำ"],
  ["DONE", "เสร็จแล้ว"],
];

type Draft = {
  groupId: string;
  tag: string;
  detail: string;
  urgency: Urgency;
  status: TicketStatus;
};

const emptyDraft = (): Draft => ({ groupId: "", tag: "", detail: "", urgency: "NORMAL", status: "RECEIVED" });

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

export function TicketsTable({
  tickets,
  currentAdmin,
  groups,
}: {
  tickets: Ticket[];
  currentAdmin: string;
  groups: TelegramGroup[];
}) {
  const router = useRouter();
  const [urgency, setUrgency] = useState<UrgencyFilter>("ALL");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [viewing, setViewing] = useState<Ticket | null>(null);
  const [deleting, setDeleting] = useState<Ticket | null>(null);
  const [busy, setBusy] = useState(false);

  async function setStatusOf(id: string, next: TicketStatus) {
    const res = await apiFetch(`/api/tickets/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) {
      toast.success("ปรับสถานะแล้ว");
      router.refresh();
    } else {
      toast.error("ปรับสถานะไม่สำเร็จ");
    }
  }

  async function deleteTicket() {
    if (!deleting) return;
    setBusy(true);
    const res = await apiFetch(`/api/tickets/${deleting.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      toast.success("ลบรายการแล้ว");
      setDeleting(null);
      router.refresh();
    } else {
      toast.error("ลบไม่สำเร็จ");
    }
  }

  async function addTicket() {
    if (!draft) return;
    setBusy(true);
    const res = await apiFetch("/api/tickets", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        groupId: draft.groupId || undefined,
        tag: draft.tag,
        detail: draft.detail || undefined,
        urgency: draft.urgency,
        status: draft.status,
      }),
    });
    setBusy(false);
    if (res.ok) {
      toast.success("เพิ่มงานแล้ว");
      setDraft(null);
      router.refresh();
    } else {
      toast.error("เพิ่มงานไม่สำเร็จ");
    }
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
    { key: "tag", header: "เรื่องที่แจ้ง" },
    { key: "urgency", header: "ความเร่งด่วน", render: (r) => <UrgencyTag urgency={r.urgency} /> },
    { key: "status", header: "สถานะ", render: (r) => <StatusTag status={r.status} /> },
    {
      key: "actions",
      header: "จัดการ",
      render: (r) => (
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" aria-label="ดูรายละเอียด" onClick={() => setViewing(r)}>
            <Eye className="size-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button size="sm" variant="outline" />}>
              ปรับสถานะ
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {STATUS_OPTIONS.map(([val, text]) => (
                <DropdownMenuItem key={val} onClick={() => setStatusOf(r.id, val)}>
                  {text}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            size="icon"
            variant="ghost"
            aria-label="ลบรายการ"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleting(r)}
          >
            <Trash2 className="size-4" />
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
            options={[["ALL", "ทั้งหมด"], ...STATUS_OPTIONS]}
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
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[820px]">
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
                  value={draft.groupId}
                  onValueChange={(v) => setDraft((d) => (d ? { ...d, groupId: v ?? "" } : d))}
                >
                  <SelectTrigger id="t-group">
                    <SelectValue placeholder="เลือกกลุ่ม" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>แอดมินผู้รับเรื่อง</Label>
                <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                  <OnlineDot online />
                  {currentAdmin}
                </div>
                <p className="text-xs text-muted-foreground">
                  ระบบบันทึกเป็นแอดมินที่กำลังเข้าสู่ระบบโดยอัตโนมัติ
                </p>
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
                    onValueChange={(v) => setDraft((d) => (d ? { ...d, urgency: v as Urgency } : d))}
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
                      {STATUS_OPTIONS.map(([val, text]) => (
                        <SelectItem key={val} value={val}>
                          {text}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>รายละเอียด</Label>
                <RichTextEditor
                  value={draft.detail}
                  onChange={(html) => setDraft((d) => (d ? { ...d, detail: html } : d))}
                  aiRewrite
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy ? "กำลังบันทึก…" : "บันทึก"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบ</DialogTitle>
            <DialogDescription>
              ลบรายการ &ldquo;{deleting?.tag}&rdquo; ({deleting?.code ?? deleting?.id}) ออกจากระบบ? ไม่สามารถกู้คืนได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(null)}>ยกเลิก</Button>
            <Button variant="destructive" disabled={busy} onClick={deleteTicket}>
              {busy ? "กำลังลบ…" : "ลบรายการ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewing !== null} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>รายละเอียดงาน {viewing?.code ?? viewing?.id}</DialogTitle>
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
