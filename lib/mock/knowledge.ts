import type { KnowledgeCollection, KnowledgeDoc } from "@/lib/types";

export const mockCollections: KnowledgeCollection[] = [
  { id: "c1", name: "แค็ตตาล็อก & ราคา", description: "ข้อมูลสินค้า ราคา โปรโมชั่น" },
  { id: "c2", name: "คู่มือการใช้งาน & FAQ", description: "วิธีใช้งานและคำถามพบบ่อย" },
  { id: "c3", name: "นโยบายตัวแทน", description: "เงื่อนไขสำหรับตัวแทนจำหน่าย" },
];

export const mockDocs: KnowledgeDoc[] = [
  { id: "d1", collectionId: "c1", type: "FILE", title: "ราคาสินค้า-2026.pdf", status: "READY" },
  { id: "d2", collectionId: "c1", type: "FAQ", title: "ค่าจัดส่งเท่าไหร่?", question: "ค่าจัดส่งเท่าไหร่?", answer: "เริ่มต้น 40 บาท ส่งฟรีเมื่อซื้อครบ 1,000 บาท", status: "READY" },
  { id: "d3", collectionId: "c2", type: "FILE", title: "คู่มือติดตั้ง.pdf", status: "PROCESSING" },
  { id: "d4", collectionId: "c2", type: "FAQ", title: "รีเซ็ตรหัสผ่านอย่างไร?", question: "รีเซ็ตรหัสผ่านอย่างไร?", answer: "ไปที่ ตั้งค่า > ความปลอดภัย > รีเซ็ตรหัสผ่าน", status: "READY" },
  { id: "d5", collectionId: "c2", type: "FILE", title: "วิธีแก้ปัญหาเบื้องต้น.docx", status: "FAILED" },
  { id: "d6", collectionId: "c3", type: "FILE", title: "สัญญาตัวแทน.pdf", status: "PENDING" },
];
