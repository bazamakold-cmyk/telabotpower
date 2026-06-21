import { describe, expect, it } from "vitest";
import { decideBotAction } from "@/lib/rag";

const base = {
  globalAutoReply: true,
  hadContext: true,
  confidence: 0.6,
  autoReplyMinConfidence: 0.5,
};

describe("decideBotAction", () => {
  it("does nothing when the bot is OFF", () => {
    expect(decideBotAction({ ...base, botMode: "OFF" })).toBe("none");
  });

  it("does nothing when there is no relevant context", () => {
    expect(decideBotAction({ ...base, botMode: "AUTO_REPLY", hadContext: false })).toBe("none");
    expect(decideBotAction({ ...base, botMode: "DRAFT", hadContext: false })).toBe("none");
  });

  it("AUTO_REPLY sends when confidence >= threshold", () => {
    expect(decideBotAction({ ...base, botMode: "AUTO_REPLY", confidence: 0.5 })).toBe("send");
    expect(decideBotAction({ ...base, botMode: "AUTO_REPLY", confidence: 0.9 })).toBe("send");
  });

  it("AUTO_REPLY falls back to a draft when below threshold", () => {
    expect(decideBotAction({ ...base, botMode: "AUTO_REPLY", confidence: 0.49 })).toBe("draft");
  });

  it("DRAFT always drafts when there is context (never auto-sends)", () => {
    expect(decideBotAction({ ...base, botMode: "DRAFT", confidence: 0.99 })).toBe("draft");
  });

  it("global kill switch off demotes AUTO_REPLY to draft (no auto-send)", () => {
    expect(
      decideBotAction({ ...base, globalAutoReply: false, botMode: "AUTO_REPLY", confidence: 0.99 })
    ).toBe("draft");
  });
});
