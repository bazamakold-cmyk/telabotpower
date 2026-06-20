import type { User } from "@/lib/types";

export const mockUsers: User[] = [
  { id: "u1", name: "ผู้ดูแลระบบ", role: "SUPER_ADMIN", username: "admin147", pinOnline: true, isActive: true },
  { id: "u2", name: "สมชาย ใจดี", role: "MANAGER", telegramId: "100000001", pinOnline: true, isActive: true },
  { id: "u3", name: "อรพิน สุขใจ", role: "ADMIN", telegramId: "100000002", pinOnline: false, isActive: true },
  { id: "u4", name: "วิภา แก้วมณี", role: "ADMIN", telegramId: "100000003", pinOnline: true, isActive: true },
  { id: "u5", name: "ธนา มั่งมี", role: "ADMIN", telegramId: "100000004", pinOnline: false, isActive: false },
  { id: "u6", name: "กมล เจริญสุข", role: "MANAGER", telegramId: "100000005", pinOnline: true, isActive: true },
];
