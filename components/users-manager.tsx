"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);

  function save() {
    if (!editing) return;
    if (editing.id) {
      setUsers((prev) => prev.map((u) => (u.id === editing.id ? editing : u)));
      toast.success("บันทึกผู้ใช้แล้ว (จำลอง)");
    } else {
      setUsers((prev) => [{ ...editing, id: `u${prev.length + 1}-${Math.round(performance.now())}` }, ...prev]);
      toast.success("เพิ่มผู้ใช้แล้ว (จำลอง)");
    }
    setEditing(null);
  }

  function confirmDelete() {
    if (!deleting) return;
    setUsers((prev) => prev.filter((u) => u.id !== deleting.id));
    toast.success(`ลบ ${deleting.name} แล้ว (จำลอง)`);
    setDeleting(null);
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
          <Button size="icon" variant="ghost" aria-label="แก้ไข" onClick={() => setEditing(u)}>
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
        <Button onClick={() => setEditing(emptyDraft())}>
          <Plus className="size-4" /> เพิ่มผู้ใช้
        </Button>
      </div>

      <ResponsiveTable columns={columns} data={users} getRowKey={(u) => u.id} />

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
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
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
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pin">PIN 6 หลัก</Label>
                <Input
                  id="pin"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="••••••"
                  className="font-mono tracking-[0.4em]"
                />
                <p className="text-xs text-muted-foreground">
                  สำหรับ Manager / Admin ใช้ PIN เข้าสู่ระบบ
                </p>
              </div>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                  ยกเลิก
                </Button>
                <Button type="submit">บันทึก</Button>
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
