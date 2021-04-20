-- AlterTable

-- the commented out statement below is what prisma generated but it is wrong
-- ALTER TABLE `Collection` MODIFY `publishedAt` TIMESTAMP(0);
-- these statements we had to enter manually to achieve the desired result

-- allow null
ALTER TABLE `Collection` MODIFY `publishedAt` TIMESTAMP(0) NULL;
-- remove default value
ALTER TABLE `Collection` ALTER `publishedAt` DROP DEFAULT;
