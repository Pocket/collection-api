import { Author, PrismaClient } from '@prisma/client';

/**
 * @param db
 * @param slug
 */
export async function getCollection(db: PrismaClient, slug) {
  return db.collection.findUnique({
    where: { slug },
    include: {
      authors: true,
      collectionStories: true,
    },
  });
}

/**
 * @param db
 * @param id
 */
export async function getAuthor(db: PrismaClient, id): Promise<Author> {
  return db.author.findUnique({ where: { id } });
}

/**
 * @param db
 * @param collectionId
 * @param storyId
 */
export async function getCollectionStory(
  db: PrismaClient,
  collectionId,
  storyId
) {
  return await db.collectionStory.findUnique({
    where: { collectionIdStoryId: { collectionId, storyId } },
    include: { story: true },
  });
}

/**
 * @param db
 */
export async function countPublishedCollections(
  db: PrismaClient
): Promise<number> {
  return db.collection.count({ where: { status: 'published' } });
}

/**
 * @param db
 * @param page
 * @param perPage
 */
export async function getPublishedCollections(db: PrismaClient, page, perPage) {
  return db.collection.findMany({
    where: { status: 'published' },
    include: {
      authors: true,
      collectionStories: true,
    },
    orderBy: { publishedAt: 'desc' },
    take: perPage,
    skip: page > 1 ? (page - 1) * perPage : 0,
  });
}

/**
 * @param db
 * @param filters
 * @param page
 * @param perPage
 */
export async function searchCollections(
  db: PrismaClient,
  filters,
  page: number = undefined,
  perPage: number = undefined
) {
  let queryParams: any = {
    where: {
      status: filters.status,
      title: { contains: filters.title },
      authors: { every: { name: { contains: filters.author } } },
    },
    include: { authors: true },
  };

  if (page && perPage) {
    queryParams = {
      orderBy: { updatedAt: 'desc' },
      take: perPage,
      skip: page > 1 ? (page - 1) * perPage : 0,
      ...queryParams,
    };
  }

  return db.collection.findMany(queryParams);
}
