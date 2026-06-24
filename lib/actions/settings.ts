"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";

export type SaveAiSettingsInput = {
  chatModel: string;
  systemPrompt: string;
  autoReplyMinConfidence: number;
  ragTopK: number;
  scoringEnabled: boolean;
};

export type SaveResult = { ok: true } | { ok: false; error: string };

export async function saveAiSettings(input: SaveAiSettingsInput): Promise<SaveResult> {
  const user = await requireRole(["SUPER_ADMIN", "MANAGER"]);
  if (!user) return { ok: false, error: "ไม่มีสิทธิ์" };

  await db.aiSetting.upsert({
    where: { id: "default" },
    update: {
      chatModel: input.chatModel,
      systemPrompt: input.systemPrompt || null,
      autoReplyMinConfidence: input.autoReplyMinConfidence,
      ragTopK: input.ragTopK,
      scoringEnabled: input.scoringEnabled,
    },
    create: {
      id: "default",
      chatModel: input.chatModel,
      systemPrompt: input.systemPrompt || null,
      autoReplyMinConfidence: input.autoReplyMinConfidence,
      ragTopK: input.ragTopK,
      scoringEnabled: input.scoringEnabled,
    },
  });

  revalidatePath("/settings");
  return { ok: true };
}

export async function getAiSettingsForUi() {
  return db.aiSetting.findUnique({ where: { id: "default" } });
}
