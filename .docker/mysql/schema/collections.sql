CREATE DATABASE IF NOT EXISTS `collections`;

USE `collections`;

/*
    stores all stories associated with any collection.

    NOTE: can we use url as the primary key?
    NOTE: how big should the url field be?
*/
DROP TABLE IF EXISTS `story`;
CREATE TABLE `story` (
    id VARCHAR(255) PRIMARY KEY,
    url VARCHAR(1000) NOT NULL UNIQUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=INNODB;

/* trigger to achieve default UUID */
CREATE TRIGGER before_insert_story
    BEFORE INSERT ON `story`
    FOR EACH ROW
    SET new.id = uuid();

/*
    stores all curation authors, whether they be pocket employees or guest curators.

    this table will enable us to see all collections auhtored by a given curator.

    - name: will be displayed in full at the top of the collection.
    - slug: for future use to provide an author page listing all their collections

    NOTE: using a single 'name' field to avoid complexities inherent in breaking
    up names into first, last, middle, initial, suffix, etc.
*/
DROP TABLE IF EXISTS `author`;
CREATE TABLE `author` (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    slug VARCHAR(300) NULL DEFAULT NULL,
    bio TEXT NULL DEFAULT NULL,
    imageUrl VARCHAR(500) NULL DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT TRUE
) ENGINE=INNODB;

/* trigger to achieve default UUID */
CREATE TRIGGER before_insert_author
    BEFORE INSERT ON `author`
    FOR EACH ROW
    SET new.id = uuid();

/* authors will be looked up by name? */
CREATE INDEX `idx_author_name` ON `author` (name);

/*
    stores a collection of stories around a central theme/topic, e.g. women in hip-hop.

    - slug: what will be displayed in the URL and will be used by clients to query.
    - excerpt: displayed beneath the title - MARKDOWN
    - intro: multi-paragraph introduction to the collection written by the curator - MARKDOWN
*/
DROP TABLE IF EXISTS `collection`;
CREATE TABLE `collection` (
    id VARCHAR(255) PRIMARY KEY,
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

/* trigger to achieve default UUID */
CREATE TRIGGER before_insert_collection
    BEFORE INSERT ON `collection`
    FOR EACH ROW
    SET new.id = uuid();

/* collections will be queried by slug. */
CREATE INDEX `idx_collection_slug` ON `collection` (slug);

/* collections will be searched (in the admin) by title. */
CREATE INDEX `idx_collection_title` ON `collection` (title);

/*
    stores authors for a given collection.

    NOTE: for MVP, we will enforce one author per collection, but it's already been
    requested (but not scoped!) to have multiple authors per collection.
*/
DROP TABLE IF EXISTS `collection_author`;
CREATE TABLE `collection_author` (
    collectionId VARCHAR(255),
    authorId VARCHAR(255),
    FOREIGN KEY (collectionId) REFERENCES `collection`(id) ON DELETE CASCADE,
    FOREIGN KEY (authorId) REFERENCES author(id) ON DELETE CASCADE,
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
    id VARCHAR(255) PRIMARY KEY,
    storyId VARCHAR(255) NULL,
    collectionId VARCHAR(255) NOT NULL,
    title VARCHAR(1000) NOT NULL,
    excerpt TEXT NOT NULL,
    imageUrl VARCHAR(1000) NOT NULL,
    authors VARCHAR(500) NOT NULL,
    publisher VARCHAR(255) NOT NULL,
    sortOrder INT NOT NULL DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(storyId) REFERENCES story(id) ON DELETE SET NULL,
    FOREIGN KEY(collectionId) REFERENCES `collection`(id) ON DELETE CASCADE
);

/* trigger to achieve default UUID */
CREATE TRIGGER before_insert_collection_story
    BEFORE INSERT ON `collection_story`
    FOR EACH ROW
    SET new.id = uuid();

/* stories will be retrieved by collection. */
CREATE INDEX `idx_collection_story_collection` ON `collection_story` (collectionId);

/*
    stores information about images uploaded from admin tools. for internal
    use only.
*/
DROP TABLE IF EXISTS `images`;
CREATE TABLE `images` (
    id VARCHAR(255) PRIMARY KEY,
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

/* trigger to achieve default UUID */
CREATE TRIGGER before_insert_images
    BEFORE INSERT ON `images`
    FOR EACH ROW
    SET new.id = uuid();

/* images will be retrieved by entityId and entityType, e.g. 123abc, 'collection' */
CREATE INDEX `idx_images_entity_entity_type` ON `images` (entityId, entityType);
