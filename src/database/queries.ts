import {
  Collection,
  CollectionAuthor,
  CollectionStatus,
  CollectionStory,
  PrismaClient,
} from '@prisma/client';

export type SearchCollectionsFilters = {
  author?: string;
  title?: string;
  status?: CollectionStatus;
};

export type CollectionWithAuthorsAndStories = Collection & {
  authors?: CollectionAuthor[];
  stories?: CollectionStory[];
};

/**
 * @param db
 * @param slug
 */
export async function getCollection(
  db: PrismaClient,
  slug: string
): Promise<CollectionWithAuthorsAndStories> {
  return db.collection.findUnique({
    where: { slug },
    include: {
      authors: true,
      stories: true,
    },
  });
}

/**
 * @param db
 * @param id
 */
export async function getAuthor(
  db: PrismaClient,
  id: number
): Promise<CollectionAuthor> {
  return db.collectionAuthor.findUnique({ where: { id } });
}

/**
 * @param db
 * @param collectionId
 * @param url
 */
export async function getCollectionStory(
  db: PrismaClient,
  collectionId: number,
  url: string
): Promise<CollectionStory> {
  return await db.collectionStory.findUnique({
    where: { collectionIdUrl: { collectionId, url } },
  });
}

/**
 * @param db
 */
export async function countPublishedCollections(
  db: PrismaClient
): Promise<number> {
  return db.collection.count({ where: { status: CollectionStatus.published } });
}

/**
 * @param db PrismaClient
 * @param slugs
 */
export async function getCollectionsBySlugs(
  db: PrismaClient,
  slugs: string[]
): Promise<Collection[]> {
  return await db.collection.findMany({
    where: { slug: { in: slugs }, status: CollectionStatus.published },
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
): Promise<Collection[]> {
  return db.collection.findMany({
    where: { status: 'published' },
    include: {
      authors: true,
      stories: true,
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
