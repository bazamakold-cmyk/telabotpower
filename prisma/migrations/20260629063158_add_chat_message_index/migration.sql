-- CreateIndex
CREATE INDEX "ChatMessage_groupId_sentAt_idx" ON "ChatMessage"("groupId", "sentAt");
