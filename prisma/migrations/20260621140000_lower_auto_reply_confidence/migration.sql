-- autoReplyMinConfidence is on the same cosine scale as ragMinScore. 0.7 was on a
-- different (probability) mental model and would essentially never auto-send for
-- voyage-3 similarities (~0.4-0.6). Lower default to 0.5 and fix untuned rows.
ALTER TABLE "AiSetting" ALTER COLUMN "autoReplyMinConfidence" SET DEFAULT 0.5;
UPDATE "AiSetting" SET "autoReplyMinConfidence" = 0.5 WHERE "autoReplyMinConfidence" = 0.7;
