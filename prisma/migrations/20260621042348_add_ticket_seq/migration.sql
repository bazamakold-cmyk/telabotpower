-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "seq" SERIAL NOT NULL;
-- CreateIndex
CREATE UNIQUE INDEX "Ticket_seq_key" ON "Ticket"("seq");
