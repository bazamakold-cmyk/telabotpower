import { expect, test } from "vitest";
import { formatTicketCode } from "@/lib/ticket-code";

test("formats ticket codes with rollover", () => {
  expect(formatTicketCode(1)).toBe("TA00001");
  expect(formatTicketCode(42)).toBe("TA00042");
  expect(formatTicketCode(99999)).toBe("TA99999");
  expect(formatTicketCode(100000)).toBe("TB00001");
});
