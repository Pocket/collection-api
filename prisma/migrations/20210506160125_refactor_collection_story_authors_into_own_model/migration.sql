/*
  Warnings:

  - You are about to drop the column `authors` on the `CollectionStory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `CollectionStory` DROP COLUMN `authors`;

-- CreateTable
CREATE TABLE `CollectionStoryAuthor` (
    `externalId` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `collectionStoryId` INTEGER NOT NULL,

    INDEX `collectionStoryId`(`collectionStoryId`),
    PRIMARY KEY (`externalId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CollectionStoryAuthor` ADD FOREIGN KEY (`collectionStoryId`) REFERENCES `CollectionStory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
