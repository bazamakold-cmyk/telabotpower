"use client";

import { Pencil, Plus, Send, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-fetch";
import { pingGroup } from "@/lib/actions/telegram";
import { ResponsiveTable, type Column } from "@/components/responsive-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import type { BotMode, KnowledgeCollection, TelegramGroup } from "@/lib/types";
import { cn } from "@/lib/utils";

const botModeLabel: Record<BotMode, string> = {
  AUTO_REPLY: "ตอบอัตโนมัติ",
  DRAFT: "ร่างให้อนุมัติ",
  OFF: "ปิด",
};

const botModeClass: Record<BotMode, string> = {
  AUTO_REPLY: "text-success border-success/30 bg-success/10",
  DRAFT: "text-warn border-warn/30 bg-warn/10",
  OFF: "text-muted-foreground border-border bg-muted/40",
};

function BotModeBadge({ mode }: { mode: BotMode }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
        botModeClass[mode]
      )}
    >
      {botModeLabel[mode]}
    </span>
  );
}

const emptyDraft = (): TelegramGroup => ({
  id: "",
  name: "",
  chatId: "",
  purpose: "",
  botMode: "DRAFT",
  collectionIds: [],
  isActive: true,
});

export function GroupsManager({
  initialGroups,
  collections,
  canEdit = true,
  canDelete = true,
}: {
  initialGroups: TelegramGroup[];
  collections: KnowledgeCollection[];
  canEdit?: boolean;
  canDelete?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<TelegramGroup | null>(null);
  const [confirmDel, setConfirmDel] = useState<TelegramGroup | null>(null);
  const [pinging, setPinging] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function ping(g: TelegramGroup) {
    setPinging(g.id);
    const r = await pingGroup(g.chatId);
    setPinging(null);
    if (r.ok) toast.success(`ส่งข้อความทดสอบเข้า “${g.name}” สำเร็จ`);
    else toast.error(r.error);
  }

  async function deleteGroup() {
    if (!confirmDel) return;
    setBusy(true);
    const res = await apiFetch(`/api/groups/${confirmDel.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      toast.success(`ลบกลุ่ม "${confirmDel.name}" แล้ว`);
      setConfirmDel(null);
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      toast.error(j.error ?? "ลบไม่สำเร็จ");
    }
  }

  async function save() {
    if (!editing) return;
    setBusy(true);
    const payload = {
      name: editing.name,
      chatId: editing.chatId,
      purpose: editing.purpose || undefined,
      botMode: editing.botMode,
      collectionIds: editing.collectionIds,
    };
    const res = editing.id
      ? await apiFetch(`/api/groups/${editing.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await apiFetch("/api/groups", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
    setBusy(false);
    if (res.ok) {
      toast.success(editing.id ? "บันทึกกลุ่มแล้ว" : "เพิ่มกลุ่มแล้ว");
      setEditing(null);
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      toast.error(j.error ?? "บันทึกไม่สำเร็จ");
    }
  }

  function toggleCollection(id: string) {
    if (!editing) return;
    const has = editing.collectionIds.includes(id);
    setEditing({
      ...editing,
      collectionIds: has
        ? editing.collectionIds.filter((c) => c !== id)
        : [...editing.collectionIds, id],
    });
  }

  const columns: Column<TelegramGroup>[] = [
    { key: "name", header: "ชื่อกลุ่ม" },
    { key: "chatId", header: "Chat ID", className: "font-mono" },
    { key: "botMode", header: "โหมดบอท", render: (g) => <BotModeBadge mode={g.botMode} /> },
    {
      key: "actions",
      header: "จัดการ",
      render: (g) => (
        <div className="flex gap-1">
          {canEdit && (
            <Button size="sm" variant="outline" disabled={pinging === g.id} onClick={() => ping(g)}>
              <Send className="size-4" /> {pinging === g.id ? "กำลังส่ง…" : "ทดสอบ"}
            </Button>
          )}
          {canEdit && (
            <Button size="icon" variant="ghost" aria-label="แก้ไข" onClick={() => setEditing(g)}>
              <Pencil className="size-4" />
            </Button>
          )}
          {canDelete && (
            <Button size="icon" variant="ghost" aria-label="ลบกลุ่ม" onClick={() => setConfirmDel(g)}>
              <Trash2 className="size-4 text-danger" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-end">
          <Button onClick={() => setEditing(emptyDraft())}>
            <Plus className="size-4" /> เพิ่มกลุ่ม
          </Button>
        </div>
      )}

      <ResponsiveTable columns={columns} data={initialGroups} getRowKey={(g) => g.id} />

      <Dialog open={confirmDel !== null} onOpenChange={(o) => { if (!o && !busy) setConfirmDel(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ลบกลุ่มนี้?</DialogTitle>
            <DialogDescription>
              ลบ "{confirmDel?.name}" ({confirmDel?.chatId}) อย่างถาวร — กู้คืนไม่ได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" disabled={busy} onClick={() => setConfirmDel(null)}>
              ยกเลิก
            </Button>
            <Button type="button" variant="destructive" disabled={busy} onClick={deleteGroup}>
              {busy ? "กำลังลบ…" : "ลบถาวร"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          {editing && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
            >
              <DialogHeader>
                <DialogTitle>{editing.id ? "แก้ไขกลุ่ม" : "เพิ่มกลุ่ม"}</DialogTitle>
                <DialogDescription>
                  ตั้งค่าวัตถุประสงค์ โหมดบอท และคลังความรู้ของกลุ่ม
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-1.5">
                <Label htmlFor="gname">ชื่อกลุ่ม</Label>
                <Input
                  id="gname"
                  required
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="chatId">Telegram Chat ID</Label>
                <Input
                  id="chatId"
                  required
                  className="font-mono"
                  value={editing.chatId}
                  onChange={(e) => setEditing({ ...editing, chatId: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="purpose">วัตถุประสงค์ของกลุ่ม</Label>
                <Textarea
                  id="purpose"
                  rows={3}
                  placeholder="เช่น ดูแลลูกค้า VIP ตอบเร็ว สุภาพ"
                  value={editing.purpose ?? ""}
                  onChange={(e) => setEditing({ ...editing, purpose: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  ใช้เป็นบริบท/น้ำเสียงให้ AI ตอบในกลุ่มนี้
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="botMode">โหมดบอท</Label>
                <Select
                  value={editing.botMode}
                  onValueChange={(v) => setEditing({ ...editing, botMode: v as BotMode })}
                >
                  <SelectTrigger id="botMode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUTO_REPLY">ตอบอัตโนมัติ</SelectItem>
                    <SelectItem value="DRAFT">ร่างให้แอดมินอนุมัติ</SelectItem>
                    <SelectItem value="OFF">ปิด (ไม่ตอบ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>คลังความรู้ที่ใช้ตอบ</Label>
                <div className="space-y-2 rounded-lg border p-3">
                  {collections.length === 0 && (
                    <p className="text-xs text-muted-foreground">ยังไม่มีคลังความรู้ — สร้างที่หน้า “คลังคู่มือ AI”</p>
                  )}
                  {collections.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={editing.collectionIds.includes(c.id)}
                        onCheckedChange={() => toggleCollection(c.id)}
                      />
                      {c.name}
                    </label>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
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
    </div>
  );
}
