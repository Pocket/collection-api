import { CollectionStatus, Prisma } from '@prisma/client';
import { CollectionsFilters, CollectionLanguage } from './types';
import config from '../config';

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

  // if a specific language was requested, attempt to filter by it
  if (
    filters?.language &&
    filters.language.toUpperCase() in CollectionLanguage
  ) {
    where.language = CollectionLanguage[filters.language.toUpperCase()];
  } else {
    // if not, default to filtering by the default language
    where.language = CollectionLanguage[config.app.defaultLanguage];
  }

  return where;
}
