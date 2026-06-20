import { expect, test } from "vitest";
import { statusMeta, urgencyMeta } from "@/lib/tags";

test("urgency maps to label + token", () => {
  expect(urgencyMeta("HIGH").token).toBe("danger");
  expect(urgencyMeta("MEDIUM").token).toBe("warn");
  expect(urgencyMeta("NORMAL").label).toBe("ปกติ");
});

test("status maps to label + token", () => {
  expect(statusMeta("WORKING").token).toBe("working");
  expect(statusMeta("DONE").token).toBe("success");
  expect(statusMeta("DONE").label).toBe("ทำเสร็จแล้ว");
});
