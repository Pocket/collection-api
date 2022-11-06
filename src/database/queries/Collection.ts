import { CollectionStatus, PrismaClient } from '@prisma/client';
import {
  SearchCollectionsFilters,
  CollectionComplete,
  CollectionsFilters,
} from '../types';
import {
  buildGetPublishedCollectionsWhere,
  buildSearchCollectionsWhereClause,
} from '../utils';

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
): Promise<CollectionComplete> {
  return await db.collection.findUnique({
    where: { externalId },
    include: {
      authors: true,
      curationCategory: true,
      IABChildCategory: true,
      IABParentCategory: true,
      partnership: true,
      stories: {
        include: {
          authors: {
            orderBy: [{ sortOrder: 'asc' }],
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      },
    },
  });
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
): Promise<CollectionComplete> {
  // slug is unique, but the generated type for `findUnique` here doesn't
  // include `status`, so using `findFirst` instead
  return db.collection.findFirst({
    where: {
      slug,
      // Allow not only published collections, but also collections under review
      // so that the curators can preview a collection before it goes live
      // officially.
      status: { in: [CollectionStatus.REVIEW, CollectionStatus.PUBLISHED] },
    },
    include: {
      authors: true,
      curationCategory: true,
      IABParentCategory: true,
      IABChildCategory: true,
      partnership: true,
      stories: {
        include: {
          authors: {
            orderBy: [{ sortOrder: 'asc' }],
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      },
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
): Promise<CollectionComplete[]> {
  return await db.collection.findMany({
    where: { slug: { in: slugs }, status: CollectionStatus.PUBLISHED },
    include: {
      authors: true,
      curationCategory: true,
      IABChildCategory: true,
      IABParentCategory: true,
      partnership: true,
      stories: {
        include: {
          authors: {
            orderBy: [{ sortOrder: 'asc' }],
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      },
    },
  });
}

/**
 * @param db
 * @param page
 * @param perPage
 * @param filters
 */
export async function getPublishedCollections(
  db: PrismaClient,
  page: number,
  perPage: number,
  filters: CollectionsFilters = null
): Promise<CollectionComplete[]> {
  return db.collection.findMany({
    where: buildGetPublishedCollectionsWhere(filters),
    include: {
      authors: true,
      curationCategory: true,
      IABChildCategory: true,
      IABParentCategory: true,
      partnership: true,
      stories: {
        include: {
          authors: {
            orderBy: [{ sortOrder: 'asc' }],
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      },
    },
    orderBy: { publishedAt: 'desc' },
    take: perPage,
    skip: page > 1 ? (page - 1) * perPage : 0,
  });
}

/**
 * @param db
 * @param filters
 */
export async function countPublishedCollections(
  db: PrismaClient,
  filters: CollectionsFilters = null
): Promise<number> {
  return db.collection.count({
    where: buildGetPublishedCollectionsWhere(filters),
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
): Promise<CollectionComplete[]> {
  let queryParams: any = {
    where: buildSearchCollectionsWhereClause(filters),
    orderBy: { updatedAt: 'desc' },
    include: {
      authors: true,
      curationCategory: true,
      IABParentCategory: true,
      IABChildCategory: true,
      labels: true,
      partnership: true,
      stories: {
        include: {
          authors: {
            orderBy: [{ sortOrder: 'asc' }],
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      },
    },
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
