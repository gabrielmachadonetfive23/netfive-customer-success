-- CreateTable
CREATE TABLE "QbrActivity" (
    "id" TEXT NOT NULL,
    "notionPageId" TEXT NOT NULL,
    "notionUrl" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "cliente" TEXT,
    "team" TEXT,
    "responsavel" TEXT,
    "status" TEXT,
    "tipo" TEXT,
    "quarter" TEXT,
    "overdue" BOOLEAN NOT NULL DEFAULT false,
    "agidesk" TEXT,
    "dueDate" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QbrActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QbrActivity_notionPageId_key" ON "QbrActivity"("notionPageId");

-- CreateIndex
CREATE INDEX "QbrActivity_cliente_idx" ON "QbrActivity"("cliente");

-- CreateIndex
CREATE INDEX "QbrActivity_status_idx" ON "QbrActivity"("status");

-- CreateIndex
CREATE INDEX "QbrActivity_team_idx" ON "QbrActivity"("team");

-- CreateIndex
CREATE INDEX "QbrActivity_overdue_idx" ON "QbrActivity"("overdue");

-- CreateIndex
CREATE INDEX "QbrActivity_dueDate_idx" ON "QbrActivity"("dueDate");
