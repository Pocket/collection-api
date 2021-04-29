import * as Sentry from '@sentry/node';
import { CollectionWithAuthorsAndStories } from '../../database/types';
import {
  countPublishedCollections,
  getCollectionBySlug as dbGetCollectionBySlug,
  getPublishedCollections,
} from '../../database/queries';
import config from '../../config';
import { CollectionsResult } from '../../typeDefs';
import { getPagination } from '../../utils';

/**
 * @param parent
 * @param slug
 * @param db
 */
export async function getCollectionBySlug(
  parent,
  { slug },
  { db }
): Promise<CollectionWithAuthorsAndStories> {
  return dbGetCollectionBySlug(db, slug);
}

/**
 * @param parent
 * @param page
 * @param perPage
 * @param db
 */
export async function getCollections(
  parent,
  { page = 1, perPage = config.app.pagination.collectionsPerPage },
  { db }
): Promise<CollectionsResult> {
  const totalResults = await countPublishedCollections(db);
  const collections = await getPublishedCollections(db, page, perPage);

  return {
    pagination: getPagination(totalResults, page, perPage),
    collections,
  };
}
