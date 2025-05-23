/*
  Warnings:

  - Added the required column `ServiceName` to the `Talent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `address` to the `Talent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firsName` to the `Talent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `generalCategory` to the `Talent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `Talent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phoneNumber` to the `Talent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `specificCategory` to the `Talent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Talent" ADD COLUMN     "ServiceName" TEXT NOT NULL,
ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "firsName" TEXT NOT NULL,
ADD COLUMN     "generalCategory" TEXT NOT NULL,
ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isOnline" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "languagesSpoken" TEXT[],
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "phoneNumber" TEXT NOT NULL,
ADD COLUMN     "specificCategory" TEXT NOT NULL;
