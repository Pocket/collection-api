import { ForbiddenError, UserInputError } from 'apollo-server-errors';
import { NotFoundError } from '@pocket-tools/apollo-utils';
import { CollectionComplete } from '../../../database/types';
import { CollectionsResult } from '../../../typeDefs';
import {
  getCollection as dbGetCollection,
  searchCollections as dbSearchCollections,
} from '../../../database/queries';
import config from '../../../config';
import { getPagination } from '../../../utils';
import { ACCESS_DENIED_ERROR } from '../../../shared/constants';

/**
 * @param parent
 * @param externalId
 * @param db
 */
export async function getCollection(
  parent,
  { externalId },
  { db, authenticatedUser }
): Promise<CollectionComplete> {
  if (!authenticatedUser.canRead) {
    throw new ForbiddenError(ACCESS_DENIED_ERROR);
  }

  const collection = await dbGetCollection(db, externalId);

  if (!collection) {
    throw new NotFoundError(externalId);
  }

  return collection;
}

/**
 * @param parent
 * @param filters
 * @param page
 * @param perPage
 * @param db
 */
export async function searchCollections(
  parent,
  { filters, page = 1, perPage = config.app.pagination.collectionsPerPage },
  { db, authenticatedUser }
): Promise<CollectionsResult> {
  if (!authenticatedUser.canRead) {
    throw new ForbiddenError(ACCESS_DENIED_ERROR);
  }

  if (
    !filters ||
    (!filters.author &&
      !filters.title &&
      !filters.status &&
      !filters.labelExternalIds)
  ) {
    throw new UserInputError(
      `At least one filter('author', 'title', 'status', 'labelExternalIds') is required`
    );
  }

  const totalResults = (await dbSearchCollections(db, filters)).length;
  const collections = await dbSearchCollections(db, filters, page, perPage);

  return {
    pagination: getPagination(totalResults, page, perPage),
    collections,
  };
}
