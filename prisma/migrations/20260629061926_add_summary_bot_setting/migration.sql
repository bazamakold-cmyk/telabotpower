-- CreateTable
CREATE TABLE "SummaryBotSetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "botToken" TEXT,
    "webhookUrl" TEXT,
    "webhookSecret" TEXT,
    "targetGroupChatId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SummaryBotSetting_pkey" PRIMARY KEY ("id")
);
