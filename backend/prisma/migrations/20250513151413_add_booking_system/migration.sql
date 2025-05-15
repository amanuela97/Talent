/*
  Warnings:

  - You are about to drop the column `customerBookingId` on the `EventBooking` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `EventBooking` table. All the data in the column will be lost.
  - You are about to drop the column `userBookingId` on the `EventBooking` table. All the data in the column will be lost.
  - The `status` column on the `EventBooking` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `clientId` to the `EventBooking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `duration` to the `EventBooking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eventDate` to the `EventBooking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eventType` to the `EventBooking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `EventBooking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `talentId` to the `EventBooking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPrice` to the `EventBooking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `EventBooking` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED');

-- DropForeignKey
ALTER TABLE "EventBooking" DROP CONSTRAINT "EventBooking_customerBookingId_fkey";

-- DropForeignKey
ALTER TABLE "EventBooking" DROP CONSTRAINT "EventBooking_userBookingId_fkey";

-- AlterTable
ALTER TABLE "EventBooking" DROP COLUMN "customerBookingId",
DROP COLUMN "date",
DROP COLUMN "userBookingId",
ADD COLUMN     "clientId" TEXT NOT NULL,
ADD COLUMN     "comments" TEXT,
ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "duration" INTEGER NOT NULL,
ADD COLUMN     "eventDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "eventType" TEXT NOT NULL,
ADD COLUMN     "location" TEXT NOT NULL,
ADD COLUMN     "talentId" TEXT NOT NULL,
ADD COLUMN     "totalPrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "BookingStatus" NOT NULL DEFAULT 'PENDING';

-- AddForeignKey
ALTER TABLE "EventBooking" ADD CONSTRAINT "EventBooking_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("talentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBooking" ADD CONSTRAINT "EventBooking_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBooking" ADD CONSTRAINT "EventBooking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("customerId") ON DELETE SET NULL ON UPDATE CASCADE;
