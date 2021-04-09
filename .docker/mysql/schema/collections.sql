CREATE DATABASE IF NOT EXISTS `collections`;

USE `collections`;

/*
    stores all stories associated with any collection.

    NOTE: can we use url as the primary key?
    NOTE: how big should the url field be?
*/
DROP TABLE IF EXISTS `stories`;
CREATE TABLE `stories` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    url VARCHAR(1000) NOT NULL UNIQUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=INNODB;

/*
    stores all curation authors, whether they be pocket employees or guest curators.

    this table will enable us to see all collections auhtored by a given curator.

    - name: will be displayed in full at the top of the collection.
    - slug: for future use to provide an author page listing all their collections

    NOTE: using a single 'name' field to avoid complexities inherent in breaking
    up names into first, last, middle, initial, suffix, etc.
*/
DROP TABLE IF EXISTS `authors`;
CREATE TABLE `authors` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    external_id VARCHAR(255) NULL,
    name VARCHAR(500) UNIQUE NOT NULL,
    slug VARCHAR(300) NULL DEFAULT NULL,
    bio TEXT NULL DEFAULT NULL,
    imageUrl VARCHAR(500) NULL DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT TRUE
) ENGINE=INNODB;

/* trigger to achieve external ID */
CREATE TRIGGER before_insert_author
    BEFORE INSERT ON `authors`
    FOR EACH ROW
    SET new.external_id = uuid();

/* authors will be looked up by name? */
CREATE INDEX `idx_author_name` ON `authors` (name);

/*
    stores a collection of stories around a central theme/topic, e.g. women in hip-hop.

    - slug: what will be displayed in the URL and will be used by clients to query.
    - excerpt: displayed beneath the title - MARKDOWN
    - intro: multi-paragraph introduction to the collection written by the curator - MARKDOWN
*/
DROP TABLE IF EXISTS `collections`;
CREATE TABLE `collections` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    external_id VARCHAR(255) NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    excerpt TEXT NULL,
    intro TEXT NULL,
    imageUrl VARCHAR(500) NULL DEFAULT NULL,
    publishedAt TIMESTAMP NULL DEFAULT NULL,
    status ENUM ('draft', 'published', 'archived') DEFAULT 'draft',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=INNODB;

/* trigger to achieve external_id GUID */
CREATE TRIGGER before_insert_collection
    BEFORE INSERT ON `collections`
    FOR EACH ROW
    SET new.external_id = uuid();

/* collections will be queried by slug. */
CREATE INDEX `idx_collection_slug` ON `collections` (slug);

/* collections will be searched (in the admin) by title. */
CREATE INDEX `idx_collection_title` ON `collections` (title);

/*
    stores authors for a given collection.

    NOTE: for MVP, we will enforce one author per collection, but it's already been
    requested (but not scoped!) to have multiple authors per collection.
*/
DROP TABLE IF EXISTS `collection_author`;
CREATE TABLE `collection_author` (
    collectionId INT,
    authorId INT,
    FOREIGN KEY (collectionId) REFERENCES `collections`(id) ON DELETE CASCADE,
    FOREIGN KEY (authorId) REFERENCES authors(id) ON DELETE CASCADE,
    PRIMARY KEY(collectionId, authorId)
) ENGINE=INNODB;

/*
    stores stories associated with a collection.

    - excerpt: a bit of text from the story, likely provided by the parser (MARKDOWN)
    - authors: a JSON array of authors - we don't need a lookup table for this
    - sortOrder: the order of the story in the collection. if null, createdAt (ascending) will
        be used for sorting.
    - active: may not be used?

    NOTE: we should store authors consistent with what we send from the parser - as  JSON blob
    NOTE: can we use storuUrl as the foreign key?
    NOTE: should we delete stories from this table, or set active to FALSE? probably the former.
*/
DROP TABLE IF EXISTS `collection_story`;
CREATE TABLE `collection_story` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    external_id VARCHAR(255),
    storyId INT NULL,
    collectionId INT NOT NULL,
    title VARCHAR(1000) NOT NULL,
    excerpt TEXT NOT NULL,
    imageUrl VARCHAR(1000) NOT NULL,
    authors VARCHAR(500) NOT NULL,
    publisher VARCHAR(255) NOT NULL,
    sortOrder INT NOT NULL DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(collectionId) REFERENCES `collections`(id) ON DELETE CASCADE,
    FOREIGN KEY(storyId) REFERENCES stories(id) ON DELETE SET NULL
);

/* trigger to achieve external_id GUID */
CREATE TRIGGER before_insert_collection_story
    BEFORE INSERT ON `collection_story`
    FOR EACH ROW
    SET new.external_id = uuid();

/* stories will be retrieved by collection. */
CREATE INDEX `idx_collection_story_collection` ON `collection_story` (collectionId);

/*
    stores information about images uploaded from admin tools. for internal
    use only.
*/
DROP TABLE IF EXISTS `images`;
CREATE TABLE `images` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entityId VARCHAR(255) NOT NULL,
    entityType ENUM('collection', 'collection_story') NOT NULL,
    sizeCategory ENUM('small', 'medium', 'large') NOT NULL DEFAULT 'large',
    width INT NULL DEFAULT NULL,
    height INT NULL DEFAULT NULL,
    mimeType VARCHAR(50) NULL DEFAULT NULL,
    fileSizeBytes INT NULL DEFAULT NULL,
    fileName VARCHAR(255) NULL DEFAULT NULL,
    path VARCHAR(500) NULL DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* images will be retrieved by entityId and entityType, e.g. 123abc, 'collection' */
CREATE INDEX `idx_images_entity_entity_type` ON `images` (entityId, entityType);
