import { UserInputError } from '@pocket-tools/apollo-utils';
import { CollectionPartner, PrismaClient } from '@prisma/client';

import {
  CreateCollectionPartnerInput,
  UpdateCollectionPartnerImageUrlInput,
  UpdateCollectionPartnerInput,
} from '../types';

/**
 * @param db
 * @param data
 */
export async function createCollectionPartner(
  db: PrismaClient,
  data: CreateCollectionPartnerInput,
): Promise<CollectionPartner> {
  return db.collectionPartner.create({ data: { ...data } });
}

/**
 * @param db
 * @param data
 */
export async function updateCollectionPartner(
  db: PrismaClient,
  data: UpdateCollectionPartnerInput,
): Promise<CollectionPartner> {
  if (!data.externalId) {
    throw new UserInputError('externalId must be provided.');
  }

  return db.collectionPartner.update({
    where: { externalId: data.externalId },
    data: { ...data },
  });
}

/**
 * @param db
 * @param data
 */
export async function updateCollectionPartnerImageUrl(
  db: PrismaClient,
  data: UpdateCollectionPartnerImageUrlInput,
): Promise<CollectionPartner> {
  if (!data.externalId) {
    throw new UserInputError('externalId must be provided.');
  }

  return db.collectionPartner.update({
    where: { externalId: data.externalId },
    data: { ...data },
  });
}
