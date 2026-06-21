import {
  BookOpen,
  LayoutDashboard,
  MessagesSquare,
  Settings,
  Sparkles,
  Ticket,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const primaryNav: NavItem[] = [
  { href: "/", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/users", label: "จัดการ PIN พนักงาน", icon: Users },
  { href: "/groups", label: "ลงทะเบียนกลุ่ม", icon: MessagesSquare },
  { href: "/knowledge", label: "คลังคู่มือ AI", icon: BookOpen },
  { href: "/tickets", label: "รายงานปัญหา", icon: Ticket },
];

export const secondaryNav: NavItem[] = [
  { href: "/assistant", label: "ผู้ช่วย AI", icon: Sparkles },
  { href: "/settings", label: "ตั้งค่า Bot & AI", icon: Settings },
];
