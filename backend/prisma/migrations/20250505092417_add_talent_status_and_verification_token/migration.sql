/*
  Warnings:

  - You are about to drop the column `bio` on the `Talent` table. All the data in the column will be lost.
  - You are about to drop the column `isApproved` on the `Talent` table. All the data in the column will be lost.
  - You are about to drop the column `isVerified` on the `Talent` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `Talent` table. All the data in the column will be lost.
  - Added the required column `verificationToken` to the `Talent` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TalentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Talent" DROP COLUMN "bio",
DROP COLUMN "isApproved",
DROP COLUMN "isVerified",
DROP COLUMN "phoneNumber",
ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "TalentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "verificationToken" TEXT NOT NULL;
