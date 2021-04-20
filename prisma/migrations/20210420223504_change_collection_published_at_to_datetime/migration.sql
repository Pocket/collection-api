-- AlterTable
-- prisma (or mysql?) doesn't seem to allow NULL on TIMESTAMP fields
-- (even when NULL is specifically allowed - see previous migration)
ALTER TABLE `Collection` MODIFY `publishedAt` DATETIME(0);
