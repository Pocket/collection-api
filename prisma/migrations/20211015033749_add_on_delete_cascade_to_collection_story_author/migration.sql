-- DropForeignKey
ALTER TABLE `CollectionStoryAuthor` DROP FOREIGN KEY `CollectionStoryAuthor_collectionStoryId_fkey`;

-- AddForeignKey
ALTER TABLE `CollectionStoryAuthor` ADD CONSTRAINT `CollectionStoryAuthor_collectionStoryId_fkey` FOREIGN KEY (`collectionStoryId`) REFERENCES `CollectionStory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `CollectionPartnership` RENAME INDEX `CollectionPartnership_collectionId_unique` TO `CollectionPartnership_collectionId_key`;
