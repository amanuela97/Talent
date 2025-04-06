/*
  Warnings:

  - The `authProvider` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Account` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE', 'CREDENTIALS');

-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_userId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "authProvider",
ADD COLUMN     "authProvider" "AuthProvider" NOT NULL DEFAULT 'CREDENTIALS';

-- DropTable
DROP TABLE "Account";
