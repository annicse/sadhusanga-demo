-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin');

-- Normalise legacy role values (e.g. 'MEMBER' written by an older add-member action)
UPDATE "User" SET "role" = 'user' WHERE "role" NOT IN ('user', 'admin');

-- AlterTable: String -> Role enum
ALTER TABLE "User"
  ALTER COLUMN "role" DROP DEFAULT,
  ALTER COLUMN "role" TYPE "Role" USING ("role"::"Role"),
  ALTER COLUMN "role" SET DEFAULT 'user';

-- CreateTable
CREATE TABLE "DeletedRecord" (
    "id" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeletedRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeletedRecord_model_deletedAt_idx" ON "DeletedRecord"("model", "deletedAt");
