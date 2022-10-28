-- CreateTable
CREATE TABLE `CollectionLabel` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `externalId` VARCHAR(255) NOT NULL,
    `labelExternalId` VARCHAR(255) NOT NULL,
    `collectionExternalId` VARCHAR(255) NOT NULL,

    INDEX `CollectionLabel_externalId_idx`(`externalId`),
    INDEX `CollectionLabel_labelExternalId_idx`(`labelExternalId`),
    INDEX `CollectionLabel_collectionExternalId_idx`(`collectionExternalId`),
    UNIQUE INDEX `CollectionLabel_externalId_key`(`externalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
