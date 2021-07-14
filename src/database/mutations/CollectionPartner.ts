import { CollectionPartner, PrismaClient } from '@prisma/client';

import {
  CreateCollectionPartnerInput,
  UpdateCollectionPartnerInput,
} from '../types';

/**
 * @param db
 * @param data
 */
export async function createCollectionPartner(
  db: PrismaClient,
  data: CreateCollectionPartnerInput
): Promise<CollectionPartner> {
  return db.collectionPartner.create({ data: { ...data } });
}

/**
 * @param db
 * @param data
 */
export async function updateCollectionPartner(
  db: PrismaClient,
  data: UpdateCollectionPartnerInput
): Promise<CollectionPartner> {
  if (!data.externalId) {
    throw new Error('externalId must be provided.');
  }

  return db.collectionPartner.update({
    where: { externalId: data.externalId },
    data: { ...data },
  });
}
