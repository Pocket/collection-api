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
  return db.collectionPartnership.findUnique({
    where: { externalId },
    include: {
      partner: true,
    },
  });
}

/**
 * @param db
 * @param externalId
 */
export async function getCollectionPartnerAssociationForCollection(
  db: PrismaClient,
  externalId: string
): Promise<CollectionPartnerAssociation> {
  return db.collectionPartnership.findFirst({
    where: {
      collection: {
        externalId,
      },
    },
    include: {
      partner: true,
    },
  });
}
