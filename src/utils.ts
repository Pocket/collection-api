import { CollectionStatus, Prisma } from '@prisma/client';
import { Pagination } from './typeDefs';
import { CollectionsFilters } from './database/types';

/**
 * Returns the pagination response object
 * @param totalResults
 * @param page
 * @param perPage
 */

export function getPagination(
  totalResults: number,
  page: number,
  perPage: number
): Pagination {
  return {
    currentPage: page,
    totalPages: Math.ceil(totalResults / perPage),
    totalResults,
    perPage,
  };
}

/**
 * Builds the `where` object for filtering PUBLISHED collections based on
 * supplied filters.
 * @param filters
 * @returns Prisma.CollectionWhereInput
 */
export function buildGetPublishedCollectionsWhere(
  filters: CollectionsFilters = null
): Prisma.CollectionWhereInput {
  // our only current use case is for public/PUBLISHED collections, so we don't
  // need status to be a filter/param
  const where: Prisma.CollectionWhereInput = {
    status: CollectionStatus.PUBLISHED,
  };

  // there may be no filtering going on
  if (filters) {
    if (filters.language) {
      where.language = filters.language.toLowerCase();
    }
  }

  return where;
}
