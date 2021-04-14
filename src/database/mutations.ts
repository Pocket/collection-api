import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';
import config from '../config';

export async function createAuthor(db: PrismaClient, data) {
  data.slug = slugify(data.name, config.slugify);

  const slugExists = await db.collectionAuthor.count({
    where: { slug: data.slug },
  });

  if (slugExists) {
    throw new Error(`Author with slug "${data.slug}" already exists`);
  }

  return db.collectionAuthor.create({ data });
}

export async function updateAuthor(db: PrismaClient, data) {
  if (!data.externalId) {
    throw new Error('externalId must be provided.');
  }

  data.slug = slugify(data.name, config.slugify);

  const slugExists = await db.collectionAuthor.count({
    where: { slug: data.slug, externalId: { not: data.externalId } },
  });

  if (slugExists) {
    throw new Error(`An author with the slug "${data.slug}" already exists`);
  }

  return db.collectionAuthor.update({
    where: { externalId: data.externalId },
    data,
  });
}

export async function createCollection(db: PrismaClient, data) {
  const slugExists = await db.collection.count({
    where: { slug: data.slug },
  });

  if (slugExists) {
    throw new Error(`A collection with the slug ${data.slug} already exists`);
  }

  return db.collection.create({ data });
}

export async function updateCollection(db: PrismaClient, data) {
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
