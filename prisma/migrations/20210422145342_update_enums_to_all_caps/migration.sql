/*
  Warnings:

  - You are about to alter the column `status` on the `Collection` table. The data in that column could be lost. The data in that column will be cast from `Enum("Collection_status")` to `Enum("Collection_status")`.
  - The values [collection,collection_story] on the enum `Image_entityType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to alter the column `sizeCategory` on the `Image` table. The data in that column could be lost. The data in that column will be cast from `Enum("Image_sizeCategory")` to `Enum("Image_sizeCategory")`.

*/
-- AlterTable
ALTER TABLE `Collection` MODIFY `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE `Image` MODIFY `entityType` ENUM('COLLECTION', 'COLLECTION_STORY') NOT NULL,
    MODIFY `sizeCategory` ENUM('SMALL', 'MEDIUM', 'LARGE') NOT NULL DEFAULT 'LARGE';
