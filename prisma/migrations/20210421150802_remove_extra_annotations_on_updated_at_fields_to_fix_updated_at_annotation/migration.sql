-- AlterTable
ALTER TABLE `Collection` MODIFY `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `CollectionAuthor` MODIFY `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `CollectionStory` MODIFY `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `Image` MODIFY `updatedAt` DATETIME(3) NOT NULL;
