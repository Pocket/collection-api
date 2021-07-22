import { CollectionPartnership, Prisma, PrismaClient } from '@prisma/client';

import {
  CreateCollectionPartnerAssociationInput,
  //UpdateCollectionPartnerAssociationInput,
} from '../types';

/**
 * @param db
 * @param data
 */
export async function createCollectionPartnerAssociation(
  db: PrismaClient,
  data: CreateCollectionPartnerAssociationInput
): Promise<CollectionPartnership> {
  const partnerExternalId = data.partnerExternalId;
  delete data.partnerExternalId;

  const collectionExternalId = data.collectionExternalId;
  delete data.collectionExternalId;

  const dbData: Prisma.CollectionPartnershipCreateInput = {
    ...data,
    partner: { connect: { externalId: partnerExternalId } },
    collection: { connect: { externalId: collectionExternalId } },
  };

  return db.collectionPartnership.create({
    data: dbData,
    include: {
      partner: true,
      collection: true,
    },
  });
}

/**
 * @param db
 * @param data
 */
// export async function updateCollectionPartnerAssociation(
//   db: PrismaClient,
//   data: UpdateCollectionPartnerAssociationInput
// ): Promise<CollectionPartnership> {
//   if (!data.externalId) {
//     throw new Error('externalId must be provided.');
//   }
//
//   return db.collectionPartnership.update({
//     where: { externalId: data.externalId },
//     data: { ...data },
//   });
// }

/**
 * @param db
 * @param externalId
 */
export async function deleteCollectionPartnerAssociation(
  db: PrismaClient,
  externalId: string
): Promise<CollectionPartnership> {
  if (externalId) {
    throw new Error('externalId must be provided.');
  }

  // delete the association between partner and collection
  return db.collectionPartnership.delete({
    where: { externalId },
  });
}
