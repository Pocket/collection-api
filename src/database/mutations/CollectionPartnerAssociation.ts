import { Prisma, PrismaClient } from '@prisma/client';

import {
  CollectionPartnerAssociation,
  CreateCollectionPartnerAssociationInput,
  UpdateCollectionPartnerAssociationImageUrlInput,
  UpdateCollectionPartnerAssociationInput,
} from '../types';
import { getCollectionPartnerAssociation } from '../queries';

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

  const dbData: Prisma.CollectionPartnershipUpdateInput = {
    ...data,
    partner: { connect: { externalId: partnerExternalId } },
  };

  return db.collectionPartnership.update({
    where: { externalId: data.externalId },
    data: dbData,
    include: {
      partner: true,
    },
  });
}

/**
 * @param db
 * @param data
 */
export async function updateCollectionPartnerAssociationImageUrl(
  db: PrismaClient,
  data: UpdateCollectionPartnerAssociationImageUrlInput
): Promise<CollectionPartnerAssociation> {
  if (!data.externalId) {
    throw new Error('externalId must be provided.');
  }

  return db.collectionPartnership.update({
    where: { externalId: data.externalId },
    data: { ...data },
    include: {
      partner: true,
    },
  });
}

/**
 * @param db
 * @param externalId
 */
export async function deleteCollectionPartnerAssociation(
  db: PrismaClient,
  externalId: string
): Promise<CollectionPartnerAssociation> {
  if (!externalId) {
    throw new Error('externalId must be provided.');
  }
  // get the existing association for the internal id
  const association = await getCollectionPartnerAssociation(db, externalId);

  await db.collectionPartnership.delete({
    where: {
      externalId: association.externalId,
    },
  });

  // When a collection-partner association is deleted, we need to make sure that
  // none of the related collection stories still have a 'fromPartner' value
  // set to true.
  await db.collectionStory.updateMany({
    where: { collectionId: association.collectionId, fromPartner: true },
    data: { fromPartner: false },
  });

  // to conform with the schema, we return the association
  // as it was before we deleted it
  return association;
}
