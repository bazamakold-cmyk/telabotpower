import {
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  MessagesSquare,
  Settings,
  Sparkles,
  Ticket,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; superOnly?: boolean };

export const primaryNav: NavItem[] = [
  { href: "/", label: "ภาพรวม", icon: LayoutDashboard, superOnly: true },
  { href: "/users", label: "จัดการ PIN พนักงาน", icon: Users, superOnly: true },
  { href: "/groups", label: "ลงทะเบียนกลุ่ม", icon: MessagesSquare, superOnly: true },
  { href: "/knowledge", label: "คลังคู่มือ AI", icon: BookOpen, superOnly: true },
  { href: "/drafts", label: "Draft รอส่ง", icon: ClipboardList },
  { href: "/tickets", label: "รายงานปัญหา", icon: Ticket },
];

export const secondaryNav: NavItem[] = [
  { href: "/assistant", label: "ผู้ช่วย AI", icon: Sparkles },
  { href: "/settings", label: "ตั้งค่า Bot & AI", icon: Settings, superOnly: true },
];
