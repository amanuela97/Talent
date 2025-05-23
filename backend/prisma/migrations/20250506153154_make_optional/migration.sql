/*
  Warnings:

  - You are about to drop the column `location` on the `Talent` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Talent" DROP COLUMN "location",
ADD COLUMN     "city" TEXT,
ALTER COLUMN "services" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "hourlyRate" DROP NOT NULL,
ALTER COLUMN "availability" DROP NOT NULL,
ALTER COLUMN "languagesSpoken" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "bio" DROP NOT NULL;
