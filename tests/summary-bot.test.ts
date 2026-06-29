import { describe, it, expect } from "vitest";
import { formatPendingChatsMessage, matchKeyword } from "@/lib/summary-bot";

describe("matchKeyword", () => {
  it("จับ keyword ตรง", () => {
    expect(matchKeyword("สรุปแชทค้าง")).toBe("สรุปแชทค้าง");
  });

  it("จับ keyword ที่อยู่กลางประโยค", () => {
    expect(matchKeyword("ช่วยสรุปแชทค้างด้วยนะ")).toBe("สรุปแชทค้าง");
  });

  it("return null ถ้าไม่ match", () => {
    expect(matchKeyword("สวัสดี")).toBeNull();
  });

  it("case-insensitive", () => {
    expect(matchKeyword("สรุปแชทค้าง")).not.toBeNull();
  });
});

describe("formatPendingChatsMessage", () => {
  it("ไม่มีค้าง → ข้อความ ✅", () => {
    const msg = formatPendingChatsMessage([], "10:00");
    expect(msg).toContain("✅ ไม่มีแชทค้าง");
    expect(msg).toContain("10:00");
  });

  it("มีค้าง > 30 นาที → 🔴", () => {
    const msg = formatPendingChatsMessage(
      [{ name: "กลุ่ม VIP", count: 3, maxWaitMin: 45 }],
      "10:00"
    );
    expect(msg).toContain("🔴 กลุ่ม VIP: 3 แชท");
    expect(msg).toContain("45 นาที");
    expect(msg).toContain("📌 รวม: 3 แชทค้าง");
  });

  it("มีค้าง 10–30 นาที → 🟡", () => {
    const msg = formatPendingChatsMessage(
      [{ name: "กลุ่ม A", count: 1, maxWaitMin: 15 }],
      "10:00"
    );
    expect(msg).toContain("🟡 กลุ่ม A");
  });

  it("มีค้าง < 10 นาที → 🟢", () => {
    const msg = formatPendingChatsMessage(
      [{ name: "กลุ่ม B", count: 2, maxWaitMin: 5 }],
      "10:00"
    );
    expect(msg).toContain("🟢 กลุ่ม B");
  });

  it("หลายกลุ่ม รวม count ถูกต้อง", () => {
    const msg = formatPendingChatsMessage(
      [
        { name: "A", count: 2, maxWaitMin: 40 },
        { name: "B", count: 1, maxWaitMin: 5 },
      ],
      "14:32"
    );
    expect(msg).toContain("📌 รวม: 3 แชทค้าง");
  });
});
