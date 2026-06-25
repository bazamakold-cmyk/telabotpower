import {
  AlertCircle,
  BookOpen,
  ClipboardList,
  History,
  LayoutDashboard,
  MessagesSquare,
  Settings,
  Sparkles,
  Ticket,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; allowedRoles?: string[] };

export const primaryNav: NavItem[] = [
  { href: "/", label: "ภาพรวม", icon: LayoutDashboard, allowedRoles: ["SUPER_ADMIN", "MANAGER"] },
  { href: "/users", label: "จัดการ PIN พนักงาน", icon: Users, allowedRoles: ["SUPER_ADMIN"] },
  { href: "/groups", label: "ลงทะเบียนกลุ่ม", icon: MessagesSquare },
  { href: "/knowledge", label: "คลังคู่มือ AI", icon: BookOpen, allowedRoles: ["SUPER_ADMIN"] },
  { href: "/logs", label: "บันทึกกิจกรรม", icon: History, allowedRoles: ["SUPER_ADMIN"] },
  { href: "/pending", label: "แชทค้าง", icon: AlertCircle },
  { href: "/drafts", label: "Draft รอส่ง", icon: ClipboardList },
  { href: "/tickets", label: "รายงานปัญหา", icon: Ticket },
];

export const secondaryNav: NavItem[] = [
  { href: "/assistant", label: "ผู้ช่วย AI", icon: Sparkles },
  { href: "/settings", label: "ตั้งค่า Bot & AI", icon: Settings, allowedRoles: ["SUPER_ADMIN"] },
];
