import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  // Dev seed — reset seed data so it can be re-run safely.
  await db.aiDraft.deleteMany();
  await db.chatMessage.deleteMany();
  await db.ticket.deleteMany();
  await db.knowledgeDoc.deleteMany();
  await db.telegramGroup.deleteMany();
  await db.knowledgeCollection.deleteMany();
  await db.session.deleteMany();
  await db.loginAttempt.deleteMany();
  await db.user.deleteMany();

  const passwordHash = await bcrypt.hash("admin123", 10);
  const pinHash = await bcrypt.hash("123456", 10);

  await db.user.create({
    data: { name: "ผู้ดูแลระบบ", role: "SUPER_ADMIN", username: "admin147", passwordHash },
  });
  const somchai = await db.user.create({
    data: { name: "สมชาย ใจดี", role: "MANAGER", telegramId: "100000001", pinHash },
  });
  const orapin = await db.user.create({
    data: { name: "อรพิน สุขใจ", role: "ADMIN", telegramId: "100000002", pinHash },
  });
  const wipha = await db.user.create({
    data: { name: "วิภา แก้วมณี", role: "ADMIN", telegramId: "100000003", pinHash },
  });

  const c1 = await db.knowledgeCollection.create({
    data: { name: "แค็ตตาล็อก & ราคา", description: "ข้อมูลสินค้า ราคา โปรโมชั่น" },
  });
  const c2 = await db.knowledgeCollection.create({
    data: { name: "คู่มือการใช้งาน & FAQ", description: "วิธีใช้งานและคำถามพบบ่อย" },
  });

  await db.knowledgeDoc.createMany({
    data: [
      { collectionId: c1.id, type: "FAQ", title: "ค่าจัดส่งเท่าไหร่?", question: "ค่าจัดส่งเท่าไหร่?", answer: "เริ่มต้น 40 บาท ส่งฟรีเมื่อซื้อครบ 1,000 บาท", status: "READY" },
      { collectionId: c2.id, type: "FAQ", title: "รีเซ็ตรหัสผ่านอย่างไร?", question: "รีเซ็ตรหัสผ่านอย่างไร?", answer: "ไปที่ ตั้งค่า > ความปลอดภัย > รีเซ็ตรหัสผ่าน", status: "READY" },
      { collectionId: c2.id, type: "FILE", title: "คู่มือติดตั้ง.pdf", status: "PROCESSING" },
    ],
  });

  const gVip = await db.telegramGroup.create({
    data: { name: "ลูกค้า VIP", chatId: "-1001000001", purpose: "ดูแลลูกค้าคนสำคัญ ตอบเร็ว สุภาพ", botMode: "DRAFT", collections: { connect: [{ id: c1.id }, { id: c2.id }] } },
  });
  const gSupport = await db.telegramGroup.create({
    data: { name: "ซัพพอร์ตทั่วไป", chatId: "-1001000002", purpose: "ช่วยแก้ปัญหาการใช้งานสินค้า", botMode: "AUTO_REPLY", collections: { connect: [{ id: c2.id }] } },
  });
  const gSales = await db.telegramGroup.create({
    data: { name: "ฝ่ายขาย", chatId: "-1001000003", purpose: "ปิดการขาย เสนอโปรโมชั่น", botMode: "DRAFT", collections: { connect: [{ id: c1.id }] } },
  });

  await db.ticket.createMany({
    data: [
      { groupId: gVip.id, adminId: somchai.id, tag: "สินค้าชำรุด", urgency: "HIGH", status: "RECEIVED" },
      { groupId: gSupport.id, adminId: orapin.id, tag: "สอบถามการใช้งาน", urgency: "MEDIUM", status: "WORKING" },
      { groupId: gSales.id, adminId: wipha.id, tag: "ขอใบเสนอราคา", urgency: "NORMAL", status: "DONE" },
      { groupId: gVip.id, adminId: somchai.id, tag: "ทวงงาน", urgency: "HIGH", status: "WORKING" },
      { groupId: gSupport.id, adminId: wipha.id, tag: "ติดตั้งไม่ได้", urgency: "HIGH", status: "DONE" },
      { groupId: gSales.id, adminId: orapin.id, tag: "สอบถามโปรโมชั่น", urgency: "NORMAL", status: "DONE" },
    ],
  });

  await db.botSetting.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
  await db.aiSetting.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });

  console.log("✅ Seed completed — admin147/admin123, PIN 123456, + groups/docs/tickets");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
