"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-fetch";
import { OnlineDot } from "@/components/online-dot";
import { ResponsiveTable, type Column } from "@/components/responsive-table";
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
import type { Role, User } from "@/lib/types";

const roleLabel: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  MANAGER: "Manager",
  ADMIN: "Admin",
};

const emptyDraft = (): User => ({
  id: "",
  name: "",
  role: "ADMIN",
  telegramId: "",
  pinOnline: false,
  isActive: true,
});

export function UsersManager({ initialUsers }: { initialUsers: User[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  function openAdd() {
    setEditing(emptyDraft());
    setPin("");
  }
  function openEdit(u: User) {
    setEditing(u);
    setPin("");
  }

  async function save() {
    if (!editing) return;
    setBusy(true);
    const payload = {
      name: editing.name,
      role: editing.role,
      telegramId: editing.telegramId || undefined,
      ...(pin.length === 6 ? { pin } : {}),
    };
    const res = editing.id
      ? await apiFetch(`/api/users/${editing.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await apiFetch("/api/users", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
    setBusy(false);
    if (res.ok) {
      toast.success(editing.id ? "บันทึกผู้ใช้แล้ว" : "เพิ่มผู้ใช้แล้ว");
      setEditing(null);
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      toast.error(j.error ?? "บันทึกไม่สำเร็จ");
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    const res = await apiFetch(`/api/users/${deleting.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(`ลบ ${deleting.name} แล้ว`);
      setDeleting(null);
      router.refresh();
    } else {
      toast.error("ลบไม่สำเร็จ");
    }
  }

  const columns: Column<User>[] = [
    { key: "name", header: "ชื่อ" },
    { key: "role", header: "บทบาท", render: (u) => roleLabel[u.role] },
    {
      key: "telegramId",
      header: "Telegram ID",
      className: "font-mono",
      render: (u) => u.telegramId ?? "—",
    },
    { key: "pinOnline", header: "PIN ออนไลน์", render: (u) => <OnlineDot online={u.pinOnline} /> },
    {
      key: "actions",
      header: "จัดการ",
      render: (u) => (
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" aria-label="แก้ไข" onClick={() => openEdit(u)}>
            <Pencil className="size-4" />
          </Button>
          <Button size="icon" variant="ghost" aria-label="ลบ" onClick={() => setDeleting(u)}>
            <Trash2 className="size-4 text-danger" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openAdd}>
          <Plus className="size-4" /> เพิ่มผู้ใช้
        </Button>
      </div>

      <ResponsiveTable columns={columns} data={initialUsers} getRowKey={(u) => u.id} />

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          {editing && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
            >
              <DialogHeader>
                <DialogTitle>{editing.id ? "แก้ไขผู้ใช้" : "เพิ่มผู้ใช้"}</DialogTitle>
                <DialogDescription>กรอกข้อมูลพนักงานและรหัส PIN</DialogDescription>
              </DialogHeader>

              <div className="space-y-1.5">
                <Label htmlFor="name">ชื่อ</Label>
                <Input
                  id="name"
                  required
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role">บทบาท</Label>
                <Select
                  value={editing.role}
                  onValueChange={(v) => setEditing({ ...editing, role: v as Role })}
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tg">Telegram ID</Label>
                <Input
                  id="tg"
                  inputMode="numeric"
                  placeholder="เช่น 100000001"
                  value={editing.telegramId ?? ""}
                  onChange={(e) => setEditing({ ...editing, telegramId: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  ใช้ระบุตัวตนว่าแอดมินตอบแชทหรือยัง —{" "}
                  <span className="font-medium text-foreground">วิธีหา ID:</span>{" "}
                  เปิด Telegram → ค้นหา{" "}
                  <span className="font-mono font-semibold text-primary">@userinfobot</span>{" "}
                  → กด Start → บอทจะแสดง <span className="font-medium">Id: ตัวเลข</span> นั่นคือ Telegram ID
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pin">PIN 6 หลัก</Label>
                <Input
                  id="pin"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder={editing.id ? "เว้นว่าง = ไม่เปลี่ยน" : "••••••"}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="font-mono tracking-[0.4em]"
                />
                <p className="text-xs text-muted-foreground">สำหรับ Manager / Admin ใช้ PIN เข้าสู่ระบบ</p>
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

      <Dialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบ</DialogTitle>
            <DialogDescription>
              ต้องการลบผู้ใช้ “{deleting?.name}” ใช่หรือไม่? การลบนี้ย้อนกลับไม่ได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              ลบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
