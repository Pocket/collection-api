import {
  CollectionLanguage,
  CollectionPartnerAssociation,
  IABParentCategory,
} from '../../database/types';
import {
  countAuthors,
  getAuthor,
  getAuthors,
  getCollectionPartnerAssociation as dbGetCollectionPartnerAssociation,
  getCollectionPartnerAssociationForCollection as dbGetCollectionPartnerAssociationForCollection,
  getCurationCategories as dbGetCurationCategories,
  getIABCategories as dbGetIABCategories,
  countPartners,
  getPartner,
  getPartners,
} from '../../database/queries';
import config from '../../config';
import {
  CollectionAuthorsResult,
  CollectionPartnersResult,
} from '../../typeDefs';
import { getPagination } from '../../utils';
import {
  CollectionAuthor,
  CollectionPartner,
  CurationCategory,
} from '@prisma/client';
import { ACCESS_DENIED_ERROR } from '../../shared/constants';

/**
 * @param parent
 * @param page
 * @param perPage
 * @param db
 */
export async function getCollectionAuthors(
  parent,
  { page = 1, perPage = config.app.pagination.authorsPerPage },
  { db, authenticatedUser }
): Promise<CollectionAuthorsResult> {
  if (!authenticatedUser.canRead) {
    throw new Error(ACCESS_DENIED_ERROR);
  }

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
  { db, authenticatedUser }
): Promise<CollectionAuthor> {
  if (!authenticatedUser.canRead) {
    throw new Error(ACCESS_DENIED_ERROR);
  }

  return await getAuthor(db, externalId);
}

/**
 * @param parent
 * @param db
 */
export async function getCurationCategories(
  parent,
  _,
  { db, authenticatedUser }
): Promise<CurationCategory[]> {
  if (!authenticatedUser.canRead) {
    throw new Error(ACCESS_DENIED_ERROR);
  }

  return await dbGetCurationCategories(db);
}

export async function getIABCategories(
  parent,
  _,
  { db, authenticatedUser }
): Promise<IABParentCategory[]> {
  if (!authenticatedUser.canRead) {
    throw new Error(ACCESS_DENIED_ERROR);
  }

  return await dbGetIABCategories(db);
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
  { db, authenticatedUser }
): Promise<CollectionPartnersResult> {
  if (!authenticatedUser.canRead) {
    throw new Error(ACCESS_DENIED_ERROR);
  }

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
  { db, authenticatedUser }
): Promise<CollectionPartner> {
  if (!authenticatedUser.canRead) {
    throw new Error(ACCESS_DENIED_ERROR);
  }

  return await getPartner(db, externalId);
}

/**
 *
 * @param parent
 * @param _ (empty because this takes no params)
 * @param db
 */
export function getLanguages(parent, _, { db, authenticatedUser }): any {
  if (!authenticatedUser.canRead) {
    throw new Error(ACCESS_DENIED_ERROR);
  }

  return Object.values(CollectionLanguage);
}

/**
 * @param parent
 * @param externalId
 * @param db
 */
export async function getCollectionPartnerAssociation(
  parent,
  { externalId },
  { db, authenticatedUser }
): Promise<CollectionPartnerAssociation> {
  if (!authenticatedUser.canRead) {
    throw new Error(ACCESS_DENIED_ERROR);
  }

  return await dbGetCollectionPartnerAssociation(db, externalId);
}

/**
 * @param parent
 * @param externalId
 * @param db
 */
export async function getCollectionPartnerAssociationForCollection(
  parent,
  { externalId },
  { db, authenticatedUser }
): Promise<CollectionPartnerAssociation> {
  if (!authenticatedUser.canRead) {
    throw new Error(ACCESS_DENIED_ERROR);
  }

  return await dbGetCollectionPartnerAssociationForCollection(db, externalId);
}
