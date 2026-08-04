-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "ownerEmail" TEXT,
ADD COLUMN     "ownerName" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Meeting_ownerEmail_idx" ON "Meeting"("ownerEmail");
