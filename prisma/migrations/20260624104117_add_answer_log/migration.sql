-- DropIndex
DROP INDEX "KnowledgeChunk_embedding_idx";

-- CreateTable
CREATE TABLE "AnswerLog" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "collectionName" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "rating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnswerLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnswerLog_collectionId_idx" ON "AnswerLog"("collectionId");

-- CreateIndex
CREATE INDEX "AnswerLog_createdAt_idx" ON "AnswerLog"("createdAt");
