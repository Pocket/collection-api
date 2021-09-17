-- DropForeignKey
ALTER TABLE `Collection` DROP FOREIGN KEY `Collection_ibfk_3`;

-- DropForeignKey
ALTER TABLE `Collection` DROP FOREIGN KEY `Collection_ibfk_2`;

-- DropForeignKey
ALTER TABLE `Collection` DROP FOREIGN KEY `Collection_ibfk_1`;

-- DropForeignKey
ALTER TABLE `CollectionPartnership` DROP FOREIGN KEY `CollectionPartnership_ibfk_2`;

-- DropForeignKey
ALTER TABLE `CollectionPartnership` DROP FOREIGN KEY `CollectionPartnership_ibfk_1`;

-- DropForeignKey
ALTER TABLE `CollectionStory` DROP FOREIGN KEY `CollectionStory_ibfk_1`;

-- DropForeignKey
ALTER TABLE `CollectionStoryAuthor` DROP FOREIGN KEY `CollectionStoryAuthor_ibfk_1`;

-- DropForeignKey
ALTER TABLE `IABCategory` DROP FOREIGN KEY `IABCategory_ibfk_1`;

-- AddForeignKey
ALTER TABLE `IABCategory` ADD CONSTRAINT `IABCategory_IABCategoryId_fkey` FOREIGN KEY (`IABCategoryId`) REFERENCES `IABCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CollectionStoryAuthor` ADD CONSTRAINT `CollectionStoryAuthor_collectionStoryId_fkey` FOREIGN KEY (`collectionStoryId`) REFERENCES `CollectionStory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CollectionStory` ADD CONSTRAINT `CollectionStory_collectionId_fkey` FOREIGN KEY (`collectionId`) REFERENCES `Collection`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Collection` ADD CONSTRAINT `Collection_curationCategoryId_fkey` FOREIGN KEY (`curationCategoryId`) REFERENCES `CurationCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Collection` ADD CONSTRAINT `Collection_IABParentCategoryId_fkey` FOREIGN KEY (`IABParentCategoryId`) REFERENCES `IABCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Collection` ADD CONSTRAINT `Collection_IABChildCategoryId_fkey` FOREIGN KEY (`IABChildCategoryId`) REFERENCES `IABCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CollectionPartnership` ADD CONSTRAINT `CollectionPartnership_partnerId_fkey` FOREIGN KEY (`partnerId`) REFERENCES `CollectionPartner`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CollectionPartnership` ADD CONSTRAINT `CollectionPartnership_collectionId_fkey` FOREIGN KEY (`collectionId`) REFERENCES `Collection`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `Collection` RENAME INDEX `Collection.slug_unique` TO `Collection_slug_key`;

-- RenameIndex
ALTER TABLE `Collection` RENAME INDEX `externalId` TO `Collection_externalId_key`;

-- RenameIndex
ALTER TABLE `Collection` RENAME INDEX `slug` TO `Collection_slug_idx`;

-- RenameIndex
ALTER TABLE `Collection` RENAME INDEX `title` TO `Collection_title_idx`;

-- RenameIndex
ALTER TABLE `CollectionAuthor` RENAME INDEX `CollectionAuthor.name_unique` TO `CollectionAuthor_name_key`;

-- RenameIndex
ALTER TABLE `CollectionAuthor` RENAME INDEX `externalId` TO `CollectionAuthor_externalId_key`;

-- RenameIndex
ALTER TABLE `CollectionAuthor` RENAME INDEX `name` TO `CollectionAuthor_name_idx`;

-- RenameIndex
ALTER TABLE `CollectionPartner` RENAME INDEX `externalId` TO `CollectionPartner_externalId_key`;

-- RenameIndex
ALTER TABLE `CollectionPartnership` RENAME INDEX `externalId` TO `CollectionPartnership_externalId_key`;

-- RenameIndex
ALTER TABLE `CollectionStory` RENAME INDEX `collectionId` TO `CollectionStory_collectionId_idx`;

-- RenameIndex
ALTER TABLE `CollectionStory` RENAME INDEX `collectionIdUrl` TO `CollectionStory_collectionId_url_key`;

-- RenameIndex
ALTER TABLE `CollectionStory` RENAME INDEX `externalId` TO `CollectionStory_externalId_key`;

-- RenameIndex
ALTER TABLE `CollectionStory` RENAME INDEX `url` TO `CollectionStory_url_idx`;

-- RenameIndex
ALTER TABLE `CollectionStoryAuthor` RENAME INDEX `collectionStoryId` TO `CollectionStoryAuthor_collectionStoryId_idx`;

-- RenameIndex
ALTER TABLE `CurationCategory` RENAME INDEX `CurationCategory.slug_unique` TO `CurationCategory_slug_key`;

-- RenameIndex
ALTER TABLE `CurationCategory` RENAME INDEX `externalId` TO `CurationCategory_externalId_key`;

-- RenameIndex
ALTER TABLE `IABCategory` RENAME INDEX `IABCategoryId` TO `IABCategory_IABCategoryId_idx`;

-- RenameIndex
ALTER TABLE `IABCategory` RENAME INDEX `externalId` TO `IABCategory_externalId_key`;

-- RenameIndex
ALTER TABLE `Image` RENAME INDEX `entityIdEntityType` TO `Image_entityId_entityType_idx`;

-- RenameIndex
ALTER TABLE `Image` RENAME INDEX `path` TO `Image_path_key`;
