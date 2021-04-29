/*
  Warnings:

  - You are about to alter the column `entityId` on the `Image` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `Int`.

*/
-- AlterTable
ALTER TABLE `Image` MODIFY `entityId` INTEGER;
