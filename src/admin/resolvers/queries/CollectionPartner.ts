import { CollectionPartnerAssociation } from '../../../database/types';
import {
  getCollectionPartnerAssociation as dbGetCollectionPartnerAssociation,
  getCollectionPartnerAssociationForCollection as dbGetCollectionPartnerAssociationForCollection,
  countPartners,
  getPartner,
  getPartners,
} from '../../../database/queries';
import config from '../../../config';
import { CollectionPartnersResult } from '../../../typeDefs';
import { getPagination } from '../../../utils';
import { CollectionPartner } from '@prisma/client';
import { ACCESS_DENIED_ERROR } from '../../../shared/constants';

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
