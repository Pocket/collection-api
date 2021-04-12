-- CreateTable
CREATE TABLE `CollectionStory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `externalId` VARCHAR(255),
    `storyId` INTEGER NOT NULL,
    `collectionId` INTEGER NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `excerpt` TEXT NOT NULL,
    `imageUrl` VARCHAR(500) NOT NULL,
    `authors` VARCHAR(255) NOT NULL,
    `publisher` VARCHAR(255) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
UNIQUE INDEX `idx_collection_id_story_id`(`collectionId`, `storyId`),
INDEX `idx_collection_id`(`collectionId`),
INDEX `idx_story_id`(`storyId`),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Image` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `entityId` VARCHAR(255) NOT NULL,
    `entityType` ENUM('collection', 'collection_story') NOT NULL,
    `sizeCategory` ENUM('small', 'medium', 'large') NOT NULL DEFAULT 'large',
    `width` INTEGER,
    `height` INTEGER,
    `mimeType` VARCHAR(255),
    `fileSizeBytes` INTEGER,
    `fileName` VARCHAR(255),
    `path` VARCHAR(255),
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
INDEX `idx_images_entity_entity_type`(`entityId`, `entityType`),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Author` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `externalId` VARCHAR(255),
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(300),
    `bio` TEXT,
    `imageUrl` VARCHAR(500),
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `active` BOOLEAN DEFAULT true,
UNIQUE INDEX `Author.name_unique`(`name`),
INDEX `idx_author_name`(`name`),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Collection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `externalId` VARCHAR(255),
    `slug` VARCHAR(300) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `excerpt` TEXT,
    `intro` TEXT,
    `imageUrl` VARCHAR(500),
    `publishedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `status` ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
UNIQUE INDEX `Collection.slug_unique`(`slug`),
INDEX `idx_collection_slug`(`slug`),
INDEX `idx_collection_title`(`title`),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Story` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `url` VARCHAR(500) NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
UNIQUE INDEX `Story.url_unique`(`url`),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_AuthorToCollection` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,
UNIQUE INDEX `_AuthorToCollection_AB_unique`(`A`, `B`),
INDEX `_AuthorToCollection_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CollectionStory` ADD FOREIGN KEY (`collectionId`) REFERENCES `Collection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CollectionStory` ADD FOREIGN KEY (`storyId`) REFERENCES `Story`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AuthorToCollection` ADD FOREIGN KEY (`A`) REFERENCES `Author`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AuthorToCollection` ADD FOREIGN KEY (`B`) REFERENCES `Collection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
