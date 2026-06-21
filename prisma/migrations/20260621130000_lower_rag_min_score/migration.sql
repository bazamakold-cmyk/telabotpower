-- Tune RAG threshold. voyage-3 cosine similarity for genuinely-relevant Thai
-- paraphrases lands ~0.4-0.6 (noise ~0.1), so the old 0.75 default rejected real
-- matches. Lower the default and fix rows still on the untuned 0.75.
ALTER TABLE "AiSetting" ALTER COLUMN "ragMinScore" SET DEFAULT 0.4;
UPDATE "AiSetting" SET "ragMinScore" = 0.4 WHERE "ragMinScore" = 0.75;
