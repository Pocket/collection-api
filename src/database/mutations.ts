import {
  Collection,
  CollectionAuthor,
  CollectionStatus,
  PrismaClient,
} from '@prisma/client';
import slugify from 'slugify';
import config from '../config';

export type CreateCollectionAuthorInput = {
  name: string;
  bio?: string;
  imageUrl?: string;
};

export type UpdateCollectionAuthorInput = {
  externalId: string;
  name: string;
  bio?: string;
  imageUrl?: string;
  active?: boolean;
};

export type CreateCollectionInput = {
  slug: string;
  title: string;
  excerpt?: string;
  intro?: string;
  imageUrl?: string;
  status?: CollectionStatus;
  authorExternalId?: string;
};

export type UpdateCollectionInput = {
  externalId: string;
  slug: string;
  title: string;
  excerpt?: string;
  intro?: string;
  imageUrl?: string;
  status?: CollectionStatus;
  authorExternalId?: string;
};

export async function createAuthor(
  db: PrismaClient,
  data: CreateCollectionAuthorInput
): Promise<CollectionAuthor> {
  const slug = slugify(data.name, config.slugify);

  const slugExists = await db.collectionAuthor.count({ where: { slug } });

  if (slugExists) {
    throw new Error(`Author with slug "${slug}" already exists`);
  }

  return db.collectionAuthor.create({ data: { ...data, slug } });
}

export async function updateAuthor(
  db: PrismaClient,
  data: UpdateCollectionAuthorInput
): Promise<CollectionAuthor> {
  if (!data.externalId) {
    throw new Error('externalId must be provided.');
  }

  const slug = slugify(data.name, config.slugify);

  const slugExists = await db.collectionAuthor.count({
    where: { slug, externalId: { not: data.externalId } },
  });

  if (slugExists) {
    throw new Error(`An author with the slug "${slug}" already exists`);
  }

  return db.collectionAuthor.update({
    where: { externalId: data.externalId },
    data: { ...data, slug },
  });
}

export async function createCollection(
  db: PrismaClient,
  data: CreateCollectionInput
): Promise<Collection> {
  const slugExists = await db.collection.count({
    where: { slug: data.slug },
  });

  if (slugExists) {
    throw new Error(`A collection with the slug ${data.slug} already exists`);
  }

  return db.collection.create({ data });
}

export async function updateCollection(
  db: PrismaClient,
  data: UpdateCollectionInput
): Promise<Collection> {
  const slugExists = await db.collection.count({
    where: { slug: data.slug, externalId: { not: data.externalId } },
  });

  if (slugExists) {
    throw new Error(
      `A different collection with the slug ${data.slug} already exists`
    );
  }

  return db.collection.update({
    where: { externalId: data.externalId },
    data,
  });
}
