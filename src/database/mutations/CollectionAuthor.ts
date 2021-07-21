import { CollectionAuthor, PrismaClient } from '@prisma/client';
import slugify from 'slugify';
import config from '../../config';

import {
  CreateCollectionAuthorInput,
  UpdateCollectionAuthorImageUrlInput,
  UpdateCollectionAuthorInput,
} from '../types';

/**
 * @param db
 * @param data
 */
export async function createCollectionAuthor(
  db: PrismaClient,
  data: CreateCollectionAuthorInput
): Promise<CollectionAuthor> {
  data.slug = data.slug || slugify(data.name, config.slugify);

  const slugExists = await db.collectionAuthor.count({
    where: { slug: data.slug },
  });

  if (slugExists) {
    throw new Error(`An author with the slug "${data.slug}" already exists`);
  }

  return db.collectionAuthor.create({ data: { ...data } });
}

/**
 * @param db
 * @param data
 */
export async function updateCollectionAuthor(
  db: PrismaClient,
  data: UpdateCollectionAuthorInput
): Promise<CollectionAuthor> {
  if (!data.externalId) {
    throw new Error('externalId must be provided.');
  }

  const slugExists = await db.collectionAuthor.count({
    where: { slug: data.slug, externalId: { not: data.externalId } },
  });

  if (slugExists) {
    throw new Error(`An author with the slug "${data.slug}" already exists`);
  }

  return db.collectionAuthor.update({
    where: { externalId: data.externalId },
    data: { ...data },
  });
}

/**
 * @param db
 * @param data
 */
export async function updateCollectionAuthorImageUrl(
  db: PrismaClient,
  data: UpdateCollectionAuthorImageUrlInput
): Promise<CollectionAuthor> {
  if (!data.externalId) {
    throw new Error('externalId must be provided.');
  }

  return db.collectionAuthor.update({
    where: { externalId: data.externalId },
    data: { ...data },
  });
}
