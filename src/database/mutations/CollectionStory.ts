import { PrismaClient } from '@prisma/client';
import { getCollectionStory, getCollection } from '../queries';

import {
  CreateCollectionStoryInput,
  CollectionStoryWithAuthors,
  UpdateCollectionStoryInput,
  UpdateCollectionStorySortOrderInput,
} from '../types';

/**
 * @param db
 * @param data
 */
export async function createCollectionStory(
  db: PrismaClient,
  data: CreateCollectionStoryInput
): Promise<CollectionStoryWithAuthors> {
  const storyExists = await db.collectionStory.count({
    where: { url: data.url },
  });

  if (storyExists) {
    throw new Error(
      `A story with the url "${data.url}" already exists in this collection`
    );
  }

  // Use the giver collection external ID to fetch the collection ID
  const collection = await getCollection(db, data.collectionExternalId);

  // delete the collectionExternalId property
  // so data matches the expected prisma type
  delete data.collectionExternalId;
  return await db.collectionStory.create({
    data: {
      ...data,
      collectionId: collection.id,
      authors: {
        create: data.authors,
      },
    },
    include: {
      authors: {
        orderBy: [{ sortOrder: 'asc' }],
      },
    },
  });
}

/**
 * @param db
 * @param data
 */
export async function updateCollectionStory(
  db: PrismaClient,
  data: UpdateCollectionStoryInput
): Promise<CollectionStoryWithAuthors> {
  const storyExists = await db.collectionStory.count({
    where: { url: data.url, externalId: { not: data.externalId } },
  });

  if (storyExists) {
    throw new Error(
      `A story with the url "${data.url}" already exists in this collection`
    );
  }

  // get collectionStory internal id for deleting authors
  const existingStory = await getCollectionStory(db, data.externalId);

  // delete related authors
  await db.collectionStoryAuthor.deleteMany({
    where: {
      collectionStoryId: existingStory.id,
    },
  });

  return await db.collectionStory.update({
    where: { externalId: data.externalId },
    data: {
      ...data,
      authors: {
        create: data.authors,
      },
    },
    include: {
      authors: {
        orderBy: [{ sortOrder: 'asc' }],
      },
    },
  });
}

/**
 * mutation dedicated to re-ordering stories within a collection
 * @param db
 * @param externalId
 * @param sortOrder
 * @returns
 */
export async function updateCollectionStorySortOrder(
  db: PrismaClient,
  data: UpdateCollectionStorySortOrderInput
): Promise<CollectionStoryWithAuthors> {
  return db.collectionStory.update({
    where: { externalId: data.externalId },
    data: {
      sortOrder: data.sortOrder,
    },
    include: {
      authors: {
        orderBy: [{ sortOrder: 'asc' }],
      },
    },
  });
}

/**
 * @param db
 * @param externalId
 */
export async function deleteCollectionStory(
  db: PrismaClient,
  externalId: string
): Promise<CollectionStoryWithAuthors> {
  // get the existing story for the internal id
  const existingStory = await getCollectionStory(db, externalId);

  // delete all associated collection story authors
  await db.collectionStoryAuthor.deleteMany({
    where: {
      collectionStoryId: existingStory.id,
    },
  });

  // delete the story
  await db.collectionStory.delete({
    where: { externalId },
  });

  // to conform with the scheam, we need to return a CollectionStory with
  // authors, which can't be done in the `.delete` call above because we
  // already deleted the authors.
  return existingStory;
}
