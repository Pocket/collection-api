import { PrismaClient } from '@prisma/client';
import { UserInputError } from '@pocket-tools/apollo-utils';
import { getCollectionStory, getCollection } from '../queries';

import {
  CreateCollectionStoryInput,
  CollectionStoryWithAuthors,
  UpdateCollectionStoryInput,
  UpdateCollectionStorySortOrderInput,
  UpdateCollectionStoryImageUrlInput,
} from '../types';

/**
 * @param db
 * @param data
 */
export async function createCollectionStory(
  db: PrismaClient,
  data: CreateCollectionStoryInput,
): Promise<CollectionStoryWithAuthors> {
  // Use the given collection external ID to fetch the collection ID
  const collection = await getCollection(db, data.collectionExternalId);

  // make sure this same story doesn't exist in the same collection
  const storyExists = await db.collectionStory.count({
    where: { url: data.url, collectionId: collection.id },
  });

  if (storyExists) {
    throw new UserInputError(
      `A story with the url "${data.url}" already exists in this collection`,
    );
  }

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
  data: UpdateCollectionStoryInput,
): Promise<CollectionStoryWithAuthors> {
  // get collectionStory internal id for deleting authors & checking for existing story
  const existingStory = await getCollectionStory(db, data.externalId);

  // if the url has changed, make sure no other stories with the same url exist on this collection
  // (if the url hasn't changed, we don't need to check - this already happens on create)
  if (data.url !== existingStory.url) {
    const storyExists = await db.collectionStory.count({
      where: {
        url: data.url,
        collectionId: existingStory.collectionId,
      },
    });

    if (storyExists) {
      throw new UserInputError(
        `A story with the url "${data.url}" already exists in this collection`,
      );
    }
  }

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
 * @param data
 * @returns
 */
export async function updateCollectionStorySortOrder(
  db: PrismaClient,
  data: UpdateCollectionStorySortOrderInput,
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
 * Mutation dedicated to updating a story with a url of an image uploaded to S3
 * @param db
 * @param data
 * @returns
 */
export async function updateCollectionStoryImageUrl(
  db: PrismaClient,
  data: UpdateCollectionStoryImageUrlInput,
): Promise<CollectionStoryWithAuthors> {
  return db.collectionStory.update({
    where: { externalId: data.externalId },
    data: {
      imageUrl: data.imageUrl,
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
  externalId: string,
): Promise<CollectionStoryWithAuthors> {
  // get the existing story for the internal id
  const existingStory = await getCollectionStory(db, externalId);

  if (!existingStory) {
    throw new UserInputError(
      `Cannot delete a collection story with external ID "${externalId}"`,
    );
  }

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
