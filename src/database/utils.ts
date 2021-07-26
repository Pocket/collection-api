import { CollectionStatus, Prisma } from '@prisma/client';
import { CollectionsFilters } from './types';
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
  if (filters?.language) {
    // make sure we only filter by supported languages
    if (isSupportedLanguage(filters.language.toLowerCase())) {
      where.language = filters.language.toLowerCase();
    } else {
      // if an unsupported language was requested, fall back to the default
      where.language = config.app.defaultLanguage;
    }
  } else {
    // if not, default to filtering en only
    where.language = config.app.defaultLanguage;
  }

  return where;
}

export function isSupportedLanguage(language?: string): boolean {
  return config.app.languages.includes(language);
}
