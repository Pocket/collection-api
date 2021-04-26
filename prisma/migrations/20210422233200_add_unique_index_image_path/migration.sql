/*
  Warnings:

  - A unique constraint covering the columns `[path]` on the table `Image` will be added. If there are existing duplicate values, this will fail.
  - Made the column `width` on table `Image` required. This step will fail if there are existing NULL values in that column.
  - Made the column `height` on table `Image` required. This step will fail if there are existing NULL values in that column.
  - Made the column `mimeType` on table `Image` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fileSizeBytes` on table `Image` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fileName` on table `Image` required. This step will fail if there are existing NULL values in that column.
  - Made the column `path` on table `Image` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Image` MODIFY `width` INTEGER NOT NULL,
    MODIFY `height` INTEGER NOT NULL,
    MODIFY `mimeType` VARCHAR(255) NOT NULL,
    MODIFY `fileSizeBytes` INTEGER NOT NULL,
    MODIFY `fileName` VARCHAR(255) NOT NULL,
    MODIFY `path` VARCHAR(255) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `path` ON `Image`(`path`);
