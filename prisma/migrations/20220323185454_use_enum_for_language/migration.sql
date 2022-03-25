/*
  Warnings:

  - You are about to alter the column `language` on the `Collection` table. The data in that column could be lost. The data in that column will be cast from `VarChar(2)` to `Enum("Collection_language")`.

*/
-- first, uppercase all existing data to match the enum
-- ('en' and 'de' should be the only existing values)
UPDATE `Collection` SET language = 'EN' WHERE language = 'en';
UPDATE `Collection` SET language = 'DE' WHERE language = 'de';

-- AlterTable
ALTER TABLE `Collection` MODIFY `language` ENUM('EN', 'DE') NOT NULL DEFAULT 'EN';
