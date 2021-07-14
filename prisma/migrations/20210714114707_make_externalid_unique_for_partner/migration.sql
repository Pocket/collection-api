/*
  Warnings:

  - A unique constraint covering the columns `[externalId]` on the table `CollectionPartner` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `externalId` ON `CollectionPartner`(`externalId`);
