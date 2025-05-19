/*
  Warnings:

  - You are about to drop the column `comments` on the `EventBooking` table. All the data in the column will be lost.
  - You are about to drop the column `totalPrice` on the `EventBooking` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EventBooking" DROP COLUMN "comments",
DROP COLUMN "totalPrice",
ADD COLUMN     "additionalComments" TEXT,
ADD COLUMN     "budgetAmount" DOUBLE PRECISION,
ADD COLUMN     "budgetRange" TEXT,
ADD COLUMN     "equipmentNeeded" TEXT,
ADD COLUMN     "eventTime" TEXT,
ADD COLUMN     "guestCount" INTEGER,
ADD COLUMN     "serviceRequirements" TEXT[];
