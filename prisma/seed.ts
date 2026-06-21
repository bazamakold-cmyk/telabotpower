import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);
  const pinHash = await bcrypt.hash("123456", 10);

  await db.user.upsert({
    where: { username: "admin147" },
    update: {},
    create: { name: "ผู้ดูแลระบบ", role: "SUPER_ADMIN", username: "admin147", passwordHash },
  });

  const staff = [
    { name: "สมชาย ใจดี", role: "MANAGER", telegramId: "100000001" },
    { name: "อรพิน สุขใจ", role: "ADMIN", telegramId: "100000002" },
    { name: "วิภา แก้วมณี", role: "ADMIN", telegramId: "100000003" },
  ] as const;
  for (const s of staff) {
    await db.user.upsert({
      where: { telegramId: s.telegramId },
      update: {},
      create: { name: s.name, role: s.role, telegramId: s.telegramId, pinHash },
    });
  }

  const c1 = await db.knowledgeCollection.create({
    data: { name: "แค็ตตาล็อก & ราคา", description: "ข้อมูลสินค้า ราคา โปรโมชั่น" },
  });
  const c2 = await db.knowledgeCollection.create({
    data: { name: "คู่มือการใช้งาน & FAQ", description: "วิธีใช้งานและคำถามพบบ่อย" },
  });

  await db.knowledgeDoc.createMany({
    data: [
      {
        collectionId: c1.id,
        type: "FAQ",
        title: "ค่าจัดส่งเท่าไหร่?",
        question: "ค่าจัดส่งเท่าไหร่?",
        answer: "เริ่มต้น 40 บาท ส่งฟรีเมื่อซื้อครบ 1,000 บาท",
        status: "READY",
      },
      {
        collectionId: c2.id,
        type: "FAQ",
        title: "รีเซ็ตรหัสผ่านอย่างไร?",
        question: "รีเซ็ตรหัสผ่านอย่างไร?",
        answer: "ไปที่ ตั้งค่า > ความปลอดภัย > รีเซ็ตรหัสผ่าน",
        status: "READY",
      },
    ],
  });

  await db.telegramGroup.create({
    data: {
      name: "ลูกค้า VIP",
      chatId: "-1001000001",
      purpose: "ดูแลลูกค้าคนสำคัญ ตอบเร็ว สุภาพ",
      botMode: "DRAFT",
      collections: { connect: [{ id: c1.id }, { id: c2.id }] },
    },
  });
  await db.telegramGroup.create({
    data: {
      name: "ซัพพอร์ตทั่วไป",
      chatId: "-1001000002",
      purpose: "ช่วยแก้ปัญหาการใช้งานสินค้า",
      botMode: "AUTO_REPLY",
      collections: { connect: [{ id: c2.id }] },
    },
  });

  await db.botSetting.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
  await db.aiSetting.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });

  console.log("✅ Seed completed — Super Admin: admin147 / admin123, staff PIN: 123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
