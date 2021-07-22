import { CollectionComplete, IABParentCategory } from '../../database/types';
import {
  countAuthors,
  getAuthor,
  getAuthors,
  getCollection as dbGetCollection,
  getCollectionStory as dbGetCollectionStory,
  getCurationCategories as dbGetCurationCategories,
  searchCollections as dbSearchCollections,
  getIABCategories as dbGetIABCategories,
  countPartners,
  getPartner,
  getPartners,
} from '../../database/queries';
import config from '../../config';
import {
  CollectionAuthorsResult,
  CollectionPartnersResult,
  CollectionsResult,
} from '../../typeDefs';
import { getPagination } from '../../utils';
import {
  CollectionAuthor,
  CollectionPartner,
  CollectionStory,
  CurationCategory,
} from '@prisma/client';

/**
 * @param parent
 * @param externalId
 * @param db
 */
export async function getCollection(
  parent,
  { externalId },
  { db }
): Promise<CollectionComplete> {
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
  _,
  { db }
): Promise<CurationCategory[]> {
  const curationCategories = await dbGetCurationCategories(db);

  return curationCategories;
}

export async function getIABCategories(
  parent,
  _,
  { db }
): Promise<IABParentCategory[]> {
  const IABCategories = dbGetIABCategories(db);

  return IABCategories;
}

/**
 * @param parent
 * @param page
 * @param perPage
 * @param db
 */
export async function getCollectionPartners(
  parent,
  { page = 1, perPage = config.app.pagination.partnersPerPage },
  { db }
): Promise<CollectionPartnersResult> {
  const totalResults = await countPartners(db);
  const partners = await getPartners(db, page, perPage);

  return {
    pagination: getPagination(totalResults, page, perPage),
    partners,
  };
}

/**
 * @param parent
 * @param externalId
 * @param db
 */
export async function getCollectionPartner(
  parent,
  { externalId },
  { db }
): Promise<CollectionPartner> {
  return getPartner(db, externalId);
}

/**
 *
 * @param parent
 * @param _ (empty because this takes no params)
 * @param db
 */
export function getLanguages(parent, _, { db }): any {
  return config.app.languages.map((lang) => {
    return {
      code: lang,
    };
  });
}
