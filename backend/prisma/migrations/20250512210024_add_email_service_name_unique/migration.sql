/*
  Warnings:

  - A unique constraint covering the columns `[serviceName]` on the table `Talent` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Talent_serviceName_key" ON "Talent"("serviceName");
