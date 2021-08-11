import { PrismaClient } from '@prisma/client';
import { CollectionPartnerAssociation } from '../types';
/**
 * @param db
 * @param externalId
 */
export async function getCollectionPartnerAssociation(
  db: PrismaClient,
  externalId: string
): Promise<CollectionPartnerAssociation> {
  const association = db.collectionPartnership.findUnique({
    where: { externalId },
    include: {
      partner: true,
    },
  });

  if (!association) {
    throw new Error(
      `Association with external ID: ${externalId} does not exist.`
    );
  }

  return association;
}

/**
 * @param db
 * @param externalId
 */
export async function getCollectionPartnerAssociationForCollection(
  db: PrismaClient,
  externalId: string
): Promise<CollectionPartnerAssociation> {
  const association = db.collectionPartnership.findFirst({
    where: {
      collection: {
        externalId,
      },
    },
    include: {
      partner: true,
    },
  });

  if (!association) {
    throw new Error(
      `Association for collection with external ID: ${externalId} does not exist.`
    );
  }

  return association;
}
