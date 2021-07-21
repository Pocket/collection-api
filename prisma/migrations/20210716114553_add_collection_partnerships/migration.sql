-- AlterTable
ALTER TABLE `CollectionStory` ADD COLUMN `fromPartner` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Image` MODIFY `entityType` ENUM('COLLECTION', 'COLLECTION_STORY', 'COLLECTION_AUTHOR', 'COLLECTION_PARTNER', 'COLLECTION_PARTNERSHIP');

-- CreateTable
CREATE TABLE `CollectionPartner` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `externalId` VARCHAR(255) NOT NULL,
    `name` VARCHAR(500) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `imageUrl` VARCHAR(500) NOT NULL,
    `blurb` TEXT NOT NULL,

    UNIQUE INDEX `externalId`(`externalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CollectionPartnership` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `externalId` VARCHAR(255) NOT NULL,
    `type` ENUM('PARTNERED', 'SPONSORED') NOT NULL DEFAULT 'PARTNERED',
    `partnerId` INTEGER NOT NULL,
    `collectionId` INTEGER NOT NULL,
    `name` VARCHAR(500),
    `url` VARCHAR(500),
    `imageUrl` VARCHAR(500),
    `blurb` TEXT,

    UNIQUE INDEX `externalId`(`externalId`),
    UNIQUE INDEX `CollectionPartnership_collectionId_unique`(`collectionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CollectionPartnership` ADD FOREIGN KEY (`partnerId`) REFERENCES `CollectionPartner`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CollectionPartnership` ADD FOREIGN KEY (`collectionId`) REFERENCES `Collection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
