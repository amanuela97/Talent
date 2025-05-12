-- CreateEnum
CREATE TYPE "CalendarEventType" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'BOOKED');

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "type" "CalendarEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "color" TEXT,
    "clientName" TEXT,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("talentId") ON DELETE RESTRICT ON UPDATE CASCADE;
