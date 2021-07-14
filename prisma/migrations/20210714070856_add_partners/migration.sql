/*
  Warnings:

  - Added the required column `partnerId` to the `CollectionPartnership` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `CollectionPartnership` ADD COLUMN `name` VARCHAR(500),
    ADD COLUMN `partnerId` INTEGER NOT NULL,
    ADD COLUMN `type` ENUM('PARTNERED', 'SPONSORED') NOT NULL DEFAULT 'PARTNERED',
    MODIFY `url` VARCHAR(500),
    MODIFY `imageUrl` VARCHAR(500),
    MODIFY `blurb` TEXT;

-- CreateTable
CREATE TABLE `CollectionPartner` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `externalId` VARCHAR(255) NOT NULL,
    `name` VARCHAR(500) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `imageUrl` VARCHAR(500) NOT NULL,
    `blurb` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CollectionPartnership` ADD FOREIGN KEY (`partnerId`) REFERENCES `CollectionPartner`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
