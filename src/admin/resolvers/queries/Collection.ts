import { ForbiddenError, NotFoundError } from '@pocket-tools/apollo-utils';
import { CollectionComplete } from '../../../database/types';
import { CollectionsResult } from '../../../typeDefs';
import {
  getCollection as dbGetCollection,
  searchCollections as dbSearchCollections,
} from '../../../database/queries';
import config from '../../../config';
import { collectionFilterValidation, getPagination } from '../../../utils';
import { ACCESS_DENIED_ERROR } from '../../../shared/constants';

/**
 * @param parent
 * @param externalId
 * @param db
 * @param authenticatedUser
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
 * @param authenticatedUser
 */
export async function searchCollections(
  parent,
  { filters, page = 1, perPage = config.app.pagination.collectionsPerPage },
  { db, authenticatedUser }
): Promise<CollectionsResult> {
  if (!authenticatedUser.canRead) {
    throw new ForbiddenError(ACCESS_DENIED_ERROR);
  }
  collectionFilterValidation(
    filters,
    'author, title, status, labelExternalIds'
  );

  const totalResults = (await dbSearchCollections(db, filters)).length;
  const collections = await dbSearchCollections(db, filters, page, perPage);

  return {
    pagination: getPagination(totalResults, page, perPage),
    collections,
  };
}
