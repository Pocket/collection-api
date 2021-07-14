/*
  Warnings:

  - You are about to drop the `Partnership` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Collection` DROP FOREIGN KEY `Collection_ibfk_4`;

-- DropTable
DROP TABLE `Partnership`;

-- CreateTable
CREATE TABLE `CollectionPartnership` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `externalId` VARCHAR(255) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `imageUrl` VARCHAR(500) NOT NULL,
    `blurb` TEXT NOT NULL,

    UNIQUE INDEX `externalId`(`externalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Collection` ADD FOREIGN KEY (`partnershipId`) REFERENCES `CollectionPartnership`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
