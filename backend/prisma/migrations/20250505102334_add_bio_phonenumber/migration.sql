/*
  Warnings:

  - Added the required column `bio` to the `Talent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phoneNumber` to the `Talent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Talent" ADD COLUMN     "bio" TEXT NOT NULL,
ADD COLUMN     "phoneNumber" TEXT NOT NULL;
