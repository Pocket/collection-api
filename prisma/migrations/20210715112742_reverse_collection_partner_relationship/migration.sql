/*
  Warnings:

  - You are about to drop the column `partnershipId` on the `Collection` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[collectionId]` on the table `CollectionPartnership` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `collectionId` to the `CollectionPartnership` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Collection` DROP FOREIGN KEY `Collection_ibfk_4`;

-- AlterTable
ALTER TABLE `Collection` DROP COLUMN `partnershipId`;

-- AlterTable
ALTER TABLE `CollectionPartnership` ADD COLUMN `collectionId` INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `CollectionPartnership_collectionId_unique` ON `CollectionPartnership`(`collectionId`);

-- AddForeignKey
ALTER TABLE `CollectionPartnership` ADD FOREIGN KEY (`collectionId`) REFERENCES `Collection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
