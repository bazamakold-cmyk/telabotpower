import {
  BookOpen,
  LayoutDashboard,
  MessagesSquare,
  Settings,
  Ticket,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const primaryNav: NavItem[] = [
  { href: "/", label: "แดชบอร์ด", icon: LayoutDashboard },
  { href: "/users", label: "ผู้ใช้/PIN", icon: Users },
  { href: "/groups", label: "กลุ่ม", icon: MessagesSquare },
  { href: "/knowledge", label: "คลังความรู้", icon: BookOpen },
  { href: "/tickets", label: "งาน/ปัญหา", icon: Ticket },
];

export const secondaryNav: NavItem[] = [
  { href: "/settings", label: "ตั้งค่า Bot & AI", icon: Settings },
];
