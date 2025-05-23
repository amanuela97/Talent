/*
  Warnings:

  - Added the required column `talentProfilePicture` to the `Talent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Talent" ADD COLUMN     "talentProfilePicture" TEXT NOT NULL;
