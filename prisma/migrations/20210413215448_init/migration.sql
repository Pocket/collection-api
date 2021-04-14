-- CreateTable
CREATE TABLE `CollectionStory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `externalId` VARCHAR(255) NOT NULL,
    `collectionId` INTEGER NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `excerpt` TEXT NOT NULL,
    `imageUrl` VARCHAR(500) NOT NULL,
    `authors` VARCHAR(255) NOT NULL,
    `publisher` VARCHAR(255) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
UNIQUE INDEX `collectionIdUrl`(`collectionId`, `url`),
UNIQUE INDEX `externalId`(`externalId`),
INDEX `collectionId`(`collectionId`),
INDEX `url`(`url`),

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
INDEX `entityIdEntityType`(`entityId`, `entityType`),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CollectionAuthor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `externalId` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(300),
    `bio` TEXT,
    `imageUrl` VARCHAR(500),
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `active` BOOLEAN DEFAULT true,
UNIQUE INDEX `CollectionAuthor.name_unique`(`name`),
INDEX `name`(`name`),
UNIQUE INDEX `externalId`(`externalId`),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Collection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `externalId` VARCHAR(255) NOT NULL,
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
INDEX `slug`(`slug`),
INDEX `title`(`title`),
UNIQUE INDEX `externalId`(`externalId`),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_CollectionToCollectionAuthor` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,
UNIQUE INDEX `_CollectionToCollectionAuthor_AB_unique`(`A`, `B`),
INDEX `_CollectionToCollectionAuthor_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CollectionStory` ADD FOREIGN KEY (`collectionId`) REFERENCES `Collection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CollectionToCollectionAuthor` ADD FOREIGN KEY (`A`) REFERENCES `Collection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CollectionToCollectionAuthor` ADD FOREIGN KEY (`B`) REFERENCES `CollectionAuthor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
