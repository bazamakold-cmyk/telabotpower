"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

type LogEntry = {
  id: string;
  action: string;
  target: string | null;
  detail: string | null;
  createdAt: string;
  user: { name: string; role: string };
};

const ACTION_LABEL: Record<string, { label: string; color: string }> = {
  LOGIN:           { label: "เข้าสู่ระบบ",        color: "text-emerald-400" },
  LOGOUT:          { label: "ออกจากระบบ",          color: "text-slate-400" },
  CREATE_USER:     { label: "เพิ่มผู้ใช้",          color: "text-blue-400" },
  UPDATE_USER:     { label: "แก้ไขผู้ใช้",          color: "text-yellow-400" },
  DELETE_USER:     { label: "ลบผู้ใช้",             color: "text-red-400" },
  CREATE_GROUP:    { label: "เพิ่มกลุ่ม",           color: "text-blue-400" },
  UPDATE_GROUP:    { label: "แก้ไขกลุ่ม",           color: "text-yellow-400" },
  DELETE_GROUP:    { label: "ลบกลุ่ม",              color: "text-red-400" },
  SEND_DRAFT:      { label: "ส่ง Draft",            color: "text-emerald-400" },
  SKIP_DRAFT:      { label: "ข้าม Draft",           color: "text-slate-400" },
  DELETE_TICKET:   { label: "ลบรายงานปัญหา",        color: "text-red-400" },
  CREATE_DOC:      { label: "เพิ่มเอกสาร/FAQ",      color: "text-blue-400" },
  DELETE_DOC:      { label: "ลบเอกสาร/FAQ",         color: "text-red-400" },
  UPDATE_SETTINGS: { label: "แก้ไขการตั้งค่า",      color: "text-yellow-400" },
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function ActivityLogTable({ logs }: { logs: LogEntry[] }) {
  const [search, setSearch] = useState("");

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    return (
      l.user.name.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      (l.target ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="ค้นหา ชื่อ / การกระทำ / เป้าหมาย…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">เวลา</th>
              <th className="px-4 py-3 font-medium">ผู้ใช้</th>
              <th className="px-4 py-3 font-medium">การกระทำ</th>
              <th className="px-4 py-3 font-medium">เป้าหมาย</th>
              <th className="px-4 py-3 font-medium hidden lg:table-cell">รายละเอียด</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  ไม่มีข้อมูล
                </td>
              </tr>
            ) : (
              filtered.map((l) => {
                const meta = ACTION_LABEL[l.action] ?? { label: l.action, color: "text-foreground" };
                return (
                  <tr key={l.id} className="border-b last:border-0 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatTime(l.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{l.user.name}</span>
                      <span className="ml-1.5 text-xs text-muted-foreground">{l.user.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${meta.color}`}>{meta.label}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{l.target ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell max-w-xs truncate">
                      {l.detail ?? "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
