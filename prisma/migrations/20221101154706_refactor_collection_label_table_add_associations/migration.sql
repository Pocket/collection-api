/*
  Warnings:

  - The primary key for the `CollectionLabel` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `collectionExternalId` on the `CollectionLabel` table. All the data in the column will be lost.
  - You are about to drop the column `externalId` on the `CollectionLabel` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `CollectionLabel` table. All the data in the column will be lost.
  - You are about to drop the column `labelExternalId` on the `CollectionLabel` table. All the data in the column will be lost.
  - Added the required column `collectionId` to the `CollectionLabel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `CollectionLabel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `labelId` to the `CollectionLabel` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `CollectionLabel_collectionExternalId_idx` ON `CollectionLabel`;

-- DropIndex
DROP INDEX `CollectionLabel_externalId_idx` ON `CollectionLabel`;

-- DropIndex
DROP INDEX `CollectionLabel_externalId_key` ON `CollectionLabel`;

-- DropIndex
DROP INDEX `CollectionLabel_labelExternalId_idx` ON `CollectionLabel`;

-- AlterTable
ALTER TABLE `CollectionLabel` DROP PRIMARY KEY,
    DROP COLUMN `collectionExternalId`,
    DROP COLUMN `externalId`,
    DROP COLUMN `id`,
    DROP COLUMN `labelExternalId`,
    ADD COLUMN `collectionId` INTEGER NOT NULL,
    ADD COLUMN `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    ADD COLUMN `createdBy` VARCHAR(255) NOT NULL,
    ADD COLUMN `labelId` INTEGER NOT NULL,
    ADD PRIMARY KEY (`labelId`, `collectionId`);

-- AddForeignKey
ALTER TABLE `CollectionLabel` ADD CONSTRAINT `CollectionLabel_labelId_fkey` FOREIGN KEY (`labelId`) REFERENCES `Label`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CollectionLabel` ADD CONSTRAINT `CollectionLabel_collectionId_fkey` FOREIGN KEY (`collectionId`) REFERENCES `Collection`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
