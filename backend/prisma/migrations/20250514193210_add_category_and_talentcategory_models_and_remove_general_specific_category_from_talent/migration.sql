/*
  Warnings:

  - You are about to drop the column `generalCategory` on the `Talent` table. All the data in the column will be lost.
  - You are about to drop the column `specificCategory` on the `Talent` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('GENERAL', 'SPECIFIC');

-- CreateEnum
CREATE TYPE "CategoryStatus" AS ENUM ('ACTIVE', 'PENDING', 'REJECTED');

-- AlterTable
ALTER TABLE "Talent" DROP COLUMN "generalCategory",
DROP COLUMN "specificCategory";

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CategoryType" NOT NULL,
    "parentId" TEXT,
    "status" "CategoryStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalentCategory" (
    "id" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TalentCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TalentCategory_talentId_categoryId_key" ON "TalentCategory"("talentId", "categoryId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentCategory" ADD CONSTRAINT "TalentCategory_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("talentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentCategory" ADD CONSTRAINT "TalentCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
