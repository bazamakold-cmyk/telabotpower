import type { TelegramGroup } from "@/lib/types";

export const mockGroups: TelegramGroup[] = [
  { id: "g1", name: "ลูกค้า VIP", chatId: "-1001000001", purpose: "ดูแลลูกค้าคนสำคัญ ตอบเร็ว สุภาพ", botMode: "DRAFT", collectionIds: ["c1", "c2"], isActive: true },
  { id: "g2", name: "ซัพพอร์ตทั่วไป", chatId: "-1001000002", purpose: "ช่วยแก้ปัญหาการใช้งานสินค้า", botMode: "AUTO_REPLY", collectionIds: ["c2"], isActive: true },
  { id: "g3", name: "ฝ่ายขาย", chatId: "-1001000003", purpose: "ปิดการขาย เสนอโปรโมชั่น", botMode: "DRAFT", collectionIds: ["c1"], isActive: true },
  { id: "g4", name: "รับเรื่องร้องเรียน", chatId: "-1001000004", purpose: "รับเรื่องร้องเรียนจากลูกค้า", botMode: "OFF", collectionIds: [], isActive: true },
  { id: "g5", name: "ตัวแทนจำหน่าย", chatId: "-1001000005", purpose: "ดูแลตัวแทนจำหน่าย", botMode: "AUTO_REPLY", collectionIds: ["c3"], isActive: false },
];
