-- AlterTable
ALTER TABLE `Collection` ADD COLUMN `curationCategoryId` INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE `CurationCategory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `externalId` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(300) NOT NULL,
    `name` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `CurationCategory.slug_unique`(`slug`),
    UNIQUE INDEX `externalId`(`externalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Collection` ADD FOREIGN KEY (`curationCategoryId`) REFERENCES `CurationCategory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

insert into CurationCategory (externalId, slug, name) values ('365bc3e5-036a-47e8-ac97-cb77222966dd', 'business', 'Business');
insert into CurationCategory (externalId, slug, name) values ('d3244423-4510-4acb-817e-25fbb489779d', 'career', 'Career');
insert into CurationCategory (externalId, slug, name) values ('e20fb31d-9378-438e-8ab2-c9b9bd797e4a', 'coronavirus', 'Coronavirus');
insert into CurationCategory (externalId, slug, name) values ('38bde055-c034-489b-9b76-fc876f92ea66', 'education', 'Education');

insert into CurationCategory (externalId, slug, name) values ('668bef88-5e17-452c-ad45-ac6661383d15', 'entertainment', 'Entertainment');
insert into CurationCategory (externalId, slug, name) values ('a829759e-5716-4187-a76b-991a5ebe5545', 'food', 'Food');
insert into CurationCategory (externalId, slug, name) values ('07855c1c-ad08-4e30-a25c-e4084bc0b1e2', 'gaming', 'Gaming');
insert into CurationCategory (externalId, slug, name) values ('d3f7bb16-6067-49d2-93aa-b5a397d31208', 'health-and-fitness', 'Health & Fitness');

insert into CurationCategory (externalId, slug, name) values ('b153cc35-911b-4d4b-b2df-2b0aef43b519', 'parenting', 'Parenting');
insert into CurationCategory (externalId, slug, name) values ('17c2da3b-a76d-4b87-8b81-2fd409f07104', 'personal-finance', 'Personal Finance');
insert into CurationCategory (externalId, slug, name) values ('ce5a1c84-87c1-4478-9555-e94831030441', 'politics', 'Politics');
insert into CurationCategory (externalId, slug, name) values ('da4fa2c3-6496-453c-9064-c48b2fb77986', 'science', 'Science');

insert into CurationCategory (externalId, slug, name) values ('e615ef91-8484-42b9-8cb7-81306b9f0f4a', 'self-improvement', 'Self Improvement');
insert into CurationCategory (externalId, slug, name) values ('bdb30949-5cde-4159-94f9-bc06f6e0a415', 'sports', 'Sports');
insert into CurationCategory (externalId, slug, name) values ('1c1695cd-3494-4368-b69c-3f04face388f', 'technology', 'Technology');
insert into CurationCategory (externalId, slug, name) values ('dbc59718-1515-4aef-9a73-ac7a7a6b06d9', 'travel', 'Travel');
