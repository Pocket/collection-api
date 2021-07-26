-- because we have existing data, this migration has been manually edited

-- add the new column, allowing NULL
ALTER TABLE `Collection` ADD COLUMN `language` VARCHAR(2) DEFAULT 'en';

-- backfill all collections with the default value so we can make this column required
UPDATE `Collection` SET `language` = 'en';

-- finally, make `language` a non-nullable column
ALTER TABLE `Collection` MODIFY `language` VARCHAR(2) NOT NULL DEFAULT 'en';
