/*
  Warnings:

  - You are about to drop the column `ServiceName` on the `Talent` table. All the data in the column will be lost.
  - You are about to drop the column `firsName` on the `Talent` table. All the data in the column will be lost.
  - Added the required column `firstName` to the `Talent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceName` to the `Talent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Talent" DROP COLUMN "ServiceName",
DROP COLUMN "firsName",
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "serviceName" TEXT NOT NULL;
