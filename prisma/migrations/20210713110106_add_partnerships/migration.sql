-- AlterTable
ALTER TABLE `Collection` ADD COLUMN `partnershipId` INTEGER;

-- AlterTable
ALTER TABLE `CollectionStory` ADD COLUMN `fromPartner` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `Partnership` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `externalId` VARCHAR(255) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `imageUrl` VARCHAR(500) NOT NULL,
    `blurb` TEXT NOT NULL,

    UNIQUE INDEX `externalId`(`externalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Collection` ADD FOREIGN KEY (`partnershipId`) REFERENCES `Partnership`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
