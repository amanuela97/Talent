-- AlterTable
ALTER TABLE "Talent" ADD COLUMN     "isPublic" BOOLEAN DEFAULT false,
ALTER COLUMN "isOnline" DROP NOT NULL;
