import type { Ticket } from "@/lib/types";

export const mockTickets: Ticket[] = [
  { id: "TK-1042", group: "ลูกค้า VIP", admin: "สมชาย ใจดี", adminOnline: true, tag: "สินค้าชำรุด", urgency: "HIGH", status: "WORKING", createdAt: "2026-06-20T09:12:00+07:00" },
  { id: "TK-1041", group: "ซัพพอร์ตทั่วไป", admin: "อรพิน สุขใจ", adminOnline: false, tag: "สอบถามการใช้งาน", urgency: "MEDIUM", status: "DONE", createdAt: "2026-06-20T08:40:00+07:00" },
  { id: "TK-1040", group: "ฝ่ายขาย", admin: "วิภา แก้วมณี", adminOnline: true, tag: "ขอใบเสนอราคา", urgency: "NORMAL", status: "DONE", createdAt: "2026-06-20T08:05:00+07:00" },
  { id: "TK-1039", group: "ลูกค้า VIP", admin: "สมชาย ใจดี", adminOnline: true, tag: "ทวงงาน", urgency: "HIGH", status: "WORKING", createdAt: "2026-06-19T17:22:00+07:00" },
  { id: "TK-1038", group: "รับเรื่องร้องเรียน", admin: "กมล เจริญสุข", adminOnline: true, tag: "ร้องเรียนบริการ", urgency: "MEDIUM", status: "WORKING", createdAt: "2026-06-19T15:48:00+07:00" },
  { id: "TK-1037", group: "ซัพพอร์ตทั่วไป", admin: "ธนา มั่งมี", adminOnline: false, tag: "ติดตั้งไม่ได้", urgency: "HIGH", status: "DONE", createdAt: "2026-06-19T14:10:00+07:00" },
  { id: "TK-1036", group: "ฝ่ายขาย", admin: "วิภา แก้วมณี", adminOnline: true, tag: "สอบถามโปรโมชั่น", urgency: "NORMAL", status: "DONE", createdAt: "2026-06-19T11:30:00+07:00" },
  { id: "TK-1035", group: "ตัวแทนจำหน่าย", admin: "กมล เจริญสุข", adminOnline: true, tag: "ขอสมัครตัวแทน", urgency: "NORMAL", status: "WORKING", createdAt: "2026-06-19T10:05:00+07:00" },
  { id: "TK-1034", group: "ลูกค้า VIP", admin: "อรพิน สุขใจ", adminOnline: false, tag: "เปลี่ยน/คืนสินค้า", urgency: "MEDIUM", status: "DONE", createdAt: "2026-06-18T16:20:00+07:00" },
  { id: "TK-1033", group: "ซัพพอร์ตทั่วไป", admin: "สมชาย ใจดี", adminOnline: true, tag: "บัคในแอป", urgency: "HIGH", status: "DONE", createdAt: "2026-06-18T13:55:00+07:00" },
];
