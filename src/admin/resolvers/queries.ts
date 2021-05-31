import { CollectionWithAuthorsAndStories } from '../../database/types';
import {
  countAuthors,
  getAuthor,
  getAuthors,
  getCollection as dbGetCollection,
  getCollectionStory as dbGetCollectionStory,
  countCurationCategories,
  getCurationCategories as dbGetCurationCategories,
  searchCollections as dbSearchCollections,
} from '../../database/queries';
import config from '../../config';
import {
  CollectionAuthorsResult,
  CollectionsResult,
  CurationCategoriesResult,
} from '../../typeDefs';
import { getPagination } from '../../utils';
import { CollectionAuthor, CollectionStory } from '@prisma/client';

/**
 * @param parent
 * @param externalId
 * @param db
 */
export async function getCollection(
  parent,
  { externalId },
  { db }
): Promise<CollectionWithAuthorsAndStories> {
  return dbGetCollection(db, externalId);
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
  { db }
): Promise<CollectionsResult> {
  if (!filters || (!filters.author && !filters.title && !filters.status)) {
    throw new Error(
      `At least one filter('author', 'title', 'status') is required`
    );
  }

  const totalResults = (await dbSearchCollections(db, filters)).length;
  const collections = await dbSearchCollections(db, filters, page, perPage);

  return {
    pagination: getPagination(totalResults, page, perPage),
    collections,
  };
}

/**
 * @param parent
 * @param page
 * @param perPage
 * @param db
 */
export async function getCollectionAuthors(
  parent,
  { page = 1, perPage = config.app.pagination.authorsPerPage },
  { db }
): Promise<CollectionAuthorsResult> {
  const totalResults = await countAuthors(db);
  const authors = await getAuthors(db, page, perPage);

  return {
    pagination: getPagination(totalResults, page, perPage),
    authors,
  };
}

/**
 * @param parent
 * @param externalId
 * @param db
 */
export async function getCollectionAuthor(
  parent,
  { externalId },
  { db }
): Promise<CollectionAuthor> {
  return getAuthor(db, externalId);
}

/**
 * @param parent
 * @param externalId
 * @param db
 */
export async function getCollectionStory(
  parent,
  { externalId },
  { db }
): Promise<CollectionStory> {
  const collectionStory = await dbGetCollectionStory(db, externalId);

  return collectionStory;
}

/**
 * @param parent
 * @param db
 */
export async function getCurationCategories(
  parent,
  { page = 1, perPage = config.app.pagination.curationCategoriesPerPage },
  { db }
): Promise<CurationCategoriesResult> {
  const totalResults = await countCurationCategories(db);
  const curationCategories = await dbGetCurationCategories(db);

  return {
    pagination: getPagination(totalResults, page, perPage),
    curationCategories,
  };
}
