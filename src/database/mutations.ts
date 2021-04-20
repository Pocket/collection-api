import {
  Collection,
  CollectionAuthor,
  CollectionStatus,
  CollectionStory,
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
  authorExternalId: string;
  publishedAt?: string;
};

export type CollectionStoryAuthor = {
  name: string;
};

export type CreateCollectionStoryInput = {
  collectionExternalId: string;
  url: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  authors: CollectionStoryAuthor[];
  publisher: string;
  sortOrder?: number;
};

export type UpdateCollectionStoryInput = Omit<
  CreateCollectionStoryInput,
  'collectionExternalId'
> & {
  externalId: string;
};

/**
 * @param db
 * @param data
 */
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

/**
 * @param db
 * @param data
 */
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

/**
 * @param db
 * @param data
 */
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

  // We have to pull the authorExternalId property out of data
  // because prisma's generated create/update types do not
  // have the authorExternalId as a property. We have it
  // as part of the mutation input to allow connecting
  // an author to a collection.
  const authorExternalId = data.authorExternalId;
  delete data.authorExternalId;

  return db.collection.create({
    data: {
      ...data,
      authors: { connect: { externalId: authorExternalId } },
    },
  });
}

/**
 * @param db
 * @param data
 */
export async function updateCollection(
  db: PrismaClient,
  data: UpdateCollectionInput
): Promise<Collection> {
  const existingCollections = await db.collection.findMany({
    where: { slug: data.slug },
  });

  if (existingCollections.length > 1) {
    throw new Error(
      `A different collection with the slug ${data.slug} already exists`
    );
  }

  // We have to pull the authorExternalId property out of data
  // because prisma's generated create/update types do not
  // have the authorExternalId as a property. We have it
  // as part of the mutation input to allow connecting
  // an author to a collection.
  const authorExternalId = data.authorExternalId;
  delete data.authorExternalId;

  // if the collection is going from unpublished to published, we update its
  // `publishedAt` time
  if (
    existingCollections[0].status !== CollectionStatus.published &&
    data.status === CollectionStatus.published
  ) {
    data.publishedAt = new Date().toISOString();
  }

  return db.collection.update({
    where: { externalId: data.externalId },
    data: {
      ...data,
      // reference: https://www.prisma.io/docs/concepts/components/prisma-client/relation-queries#disconnect-all-related-records
      // set: [] disconnects all authors from the collection
      // before connecting new authors, essentially a sync
      // of authors for a collection
      authors: { set: [], connect: { externalId: authorExternalId } },
    },
  });
}

/**
 * @param db
 * @param externalId
 */
export async function getCollectionByExternalId(
  db: PrismaClient,
  externalId: string
): Promise<Collection> {
  const collection = await db.collection.findUnique({ where: { externalId } });

  if (!collection) {
    throw new Error(
      `Collection with external ID: ${externalId} does not exist.`
    );
  }

  return collection;
}

/**
 * @param db
 * @param data
 */
export async function createCollectionStory(
  db: PrismaClient,
  data: CreateCollectionStoryInput
): Promise<CollectionStory> {
  // Use the giver collection external ID to fetch the collection ID
  const collection = await getCollectionByExternalId(
    db,
    data.collectionExternalId
  );

  // delete the collectionExternalId property
  // so data matches the expected prisma type
  delete data.collectionExternalId;
  const story = await db.collectionStory.create({
    data: {
      ...data,
      collectionId: collection.id,
      authors: JSON.stringify(data.authors),
    },
  });

  return { ...story, authors: JSON.parse(story.authors) };
}

/**
 * @param db
 * @param data
 */
export async function updateCollectionStory(
  db: PrismaClient,
  data: UpdateCollectionStoryInput
): Promise<CollectionStory> {
  const story = await db.collectionStory.update({
    where: { externalId: data.externalId },
    data: { ...data, authors: JSON.stringify(data.authors) },
  });

  return { ...story, authors: JSON.parse(story.authors) };
}

/**
 * @param db
 * @param externalId
 */
export async function deleteCollectionStory(
  db: PrismaClient,
  externalId: string
): Promise<CollectionStory> {
  return await db.collectionStory.delete({ where: { externalId } });
}
