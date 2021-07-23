import { Prisma, PrismaClient } from '@prisma/client';

import {
  CollectionPartnerAssociation,
  CreateCollectionPartnerAssociationInput,
  UpdateCollectionPartnerAssociationInput,
} from '../types';

/**
 * @param db
 * @param data
 */
export async function createCollectionPartnerAssociation(
  db: PrismaClient,
  data: CreateCollectionPartnerAssociationInput
): Promise<CollectionPartnerAssociation> {
  // this property doesn't exist on the Association type returned by this
  // function, instead we return the CollectionPartner object
  const partnerExternalId = data.partnerExternalId;
  delete data.partnerExternalId;

  // this property doesn't exist on the Association type returned by this
  // function, instead we return the Collection object
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
export async function updateCollectionPartnerAssociation(
  db: PrismaClient,
  data: UpdateCollectionPartnerAssociationInput
): Promise<CollectionPartnerAssociation> {
  if (!data.externalId) {
    throw new Error('externalId must be provided.');
  }

  // this property doesn't exist on the Association type returned by this
  // function, instead we return the CollectionPartner object
  const partnerExternalId = data.partnerExternalId;
  delete data.partnerExternalId;

  // this property doesn't exist on the Association type returned by this
  // function, instead we return the Collection object
  const collectionExternalId = data.collectionExternalId;
  delete data.collectionExternalId;

  const dbData: Prisma.CollectionPartnershipUpdateInput = {
    ...data,
    partner: { connect: { externalId: partnerExternalId } },
    collection: { connect: { externalId: collectionExternalId } },
  };

  return db.collectionPartnership.update({
    where: { externalId: data.externalId },
    data: dbData,
    include: {
      partner: true,
      collection: true,
    },
  });
}

/**
 * @param db
 * @param externalId
 */
// export async function deleteCollectionPartnerAssociation(
//   db: PrismaClient,
//   externalId: string
// ): Promise<CollectionPartnerAssociation> {
//   if (externalId) {
//     throw new Error('externalId must be provided.');
//   }
//
//   // delete the association between partner and collection
//   return db.collectionPartnership.delete({
//     where: { externalId },
//   });
// }
