import { CollectionStatus, Prisma } from '@prisma/client';
import { UserInputError } from '@pocket-tools/apollo-utils';
import {
  CollectionsFilters,
  CollectionLanguage,
  SearchCollectionsFilters,
} from './types';
import config from '../config';

/**
 * Builds the `where` object for filtering PUBLISHED collections based on
 * supplied filters.
 * @param filters
 * @returns Prisma.CollectionWhereInput
 */
export function buildGetPublishedCollectionsWhere(
  filters: CollectionsFilters = null,
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

  // if labels are provided on the filter, update the WHERE clause
  if (filters?.labels && filters?.labels.length != 0) {
    where.labels = {
      some: { label: { name: { in: filters.labels } } },
    };
  }

  return where;
}

/**
 * Builds the `where` object for filtering searchCollections based on
 * supplied filters
 * @param filters
 * @returns Prisma.CollectionWhereInput
 */
export function buildSearchCollectionsWhereClause(
  filters: SearchCollectionsFilters = null,
): Prisma.CollectionWhereInput {
  const where: Prisma.CollectionWhereInput = {};
  if (filters.labelExternalIds) {
    where.labels = {
      some: { label: { externalId: { in: filters.labelExternalIds } } },
    };
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.title) {
    where.title = { contains: filters.title };
  }
  if (filters.author) {
    where.authors = { every: { name: { contains: filters.author } } };
  }

  return where;
}

export function checkCollectionLabelLimit(labelExternalIds: string[]) {
  if (labelExternalIds.length > config.app.collectionLabelLimit) {
    throw new UserInputError(
      `Too many labels provided: ${config.app.collectionLabelLimit} allowed, ${labelExternalIds.length} provided.`,
    );
  }
}
