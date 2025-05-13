/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `Talent` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `Talent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Talent" ADD COLUMN     "email" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Talent_email_key" ON "Talent"("email");
