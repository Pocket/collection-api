import {
  Collection,
  CollectionAuthor,
  CollectionStatus,
  CollectionStory,
  PrismaClient,
} from '@prisma/client';

import {
  SearchCollectionsFilters,
  CollectionWithAuthorsAndStories,
} from './types';

// -------------------------------
// COLLECTION QUERIES
// -------------------------------

/**
 * this is primarily an admin query, which is why we don't return any author
 * or story information.
 *
 * @param db
 * @param externalId
 */
export async function getCollection(
  db: PrismaClient,
  externalId: string
): Promise<CollectionWithAuthorsAndStories> {
  const collection = db.collection.findUnique({
    where: { externalId },
    include: {
      authors: true,
      stories: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
    },
  });

  if (!collection) {
    throw new Error(
      `Collection with external ID: ${externalId} does not exist.`
    );
  }

  return collection;
}

/**
 * this is primarily a client query, which is why we include authors and
 * stories by default.
 *
 * @param db
 * @param slug
 */
export async function getCollectionBySlug(
  db: PrismaClient,
  slug: string
): Promise<CollectionWithAuthorsAndStories> {
  // slug is unique, but the generated type for `findUnique` here doesn't
  // include `status`, so using `findFirst` instead
  return db.collection.findFirst({
    where: { slug, status: CollectionStatus.PUBLISHED },
    include: {
      authors: true,
      stories: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
    },
  });
}

/**
 * @param db PrismaClient
 * @param slugs
 */
export async function getCollectionsBySlugs(
  db: PrismaClient,
  slugs: string[]
): Promise<CollectionWithAuthorsAndStories[]> {
  return await db.collection.findMany({
    where: { slug: { in: slugs }, status: CollectionStatus.PUBLISHED },
    include: {
      authors: true,
      stories: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
    },
  });
}

/**
 * @param db
 * @param page
 * @param perPage
 */
export async function getPublishedCollections(
  db: PrismaClient,
  page: number,
  perPage: number
): Promise<CollectionWithAuthorsAndStories[]> {
  return db.collection.findMany({
    where: { status: CollectionStatus.PUBLISHED },
    include: {
      authors: true,
      stories: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
    },
    orderBy: { publishedAt: 'desc' },
    take: perPage,
    skip: page > 1 ? (page - 1) * perPage : 0,
  });
}

/**
 * @param db
 */
export async function countPublishedCollections(
  db: PrismaClient
): Promise<number> {
  return db.collection.count({ where: { status: CollectionStatus.PUBLISHED } });
}

/**
 * @param db
 * @param filters
 * @param page
 * @param perPage
 */
export async function searchCollections(
  db: PrismaClient,
  filters: SearchCollectionsFilters,
  page: number = undefined,
  perPage: number = undefined
): Promise<CollectionWithAuthorsAndStories[]> {
  let queryParams: any = {
    where: {
      status: filters.status,
      title: { contains: filters.title },
      authors: { every: { name: { contains: filters.author } } },
    },
    orderBy: { updatedAt: 'desc' },
    include: { authors: true },
  };

  if (page && perPage) {
    queryParams = {
      take: perPage,
      skip: page > 1 ? (page - 1) * perPage : 0,
      ...queryParams,
    };
  }

  return db.collection.findMany(queryParams);
}

// -------------------------------
// AUTHOR QUERIES
// -------------------------------

/**
 * @param db
 * @param externalId
 */
export async function getAuthor(
  db: PrismaClient,
  externalId: string
): Promise<CollectionAuthor> {
  return db.collectionAuthor.findUnique({ where: { externalId } });
}

/**
 * @param db
 * @param page
 * @param perPage
 */
export async function getAuthors(
  db: PrismaClient,
  page: number,
  perPage: number
): Promise<CollectionAuthor[]> {
  return db.collectionAuthor.findMany({
    take: perPage,
    skip: page > 1 ? (page - 1) * perPage : 0,
    orderBy: { name: 'asc' },
  });
}

/**
 * @param db
 */
export async function countAuthors(db: PrismaClient): Promise<number> {
  return db.collectionAuthor.count();
}

// -------------------------------
// COLLECTION STORY QUERIES
// -------------------------------
/**
 * @param db
 * @param collectionId
 * @param url
 */
export async function getCollectionStory(
  db: PrismaClient,
  externalId: string
): Promise<CollectionStory> {
  return await db.collectionStory.findUnique({
    where: { externalId },
  });
}
