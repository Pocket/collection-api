import { CollectionStatus, PrismaClient } from '@prisma/client';
import { getCollection } from '../queries';

import {
  CollectionWithAuthorsAndStories,
  CreateCollectionInput,
  UpdateCollectionImageUrlInput,
  UpdateCollectionInput,
} from '../types';

/**
 * @param db
 * @param data
 */
export async function createCollection(
  db: PrismaClient,
  data: CreateCollectionInput
): Promise<CollectionWithAuthorsAndStories> {
  const slugExists = await db.collection.count({
    where: { slug: data.slug },
  });

  if (slugExists) {
    throw new Error(`A collection with the slug "${data.slug}" already exists`);
  }

  // We have to pull the authorExternalId property out of data
  // because prisma's generated create/update types do not
  // have the authorExternalId as a property. We have it
  // as part of the mutation input to allow connecting
  // an author to a collection.
  const authorExternalId = data.authorExternalId;
  delete data.authorExternalId;

  // And we do the same thing for the curationCategoryExternalId
  // property
  const curationCategoryExternalId = data.curationCategoryExternalId;
  delete data.curationCategoryExternalId;

  return db.collection.create({
    data: {
      ...data,
      authors: { connect: { externalId: authorExternalId } },
      curationCategory: { connect: { externalId: curationCategoryExternalId } },
    },
    include: {
      authors: true,
      curationCategory: true,
      stories: {
        // note that this include is only present to satisfy the return type
        // there will never be any stories (or story authors) at the time a
        // collection is created
        include: {
          authors: {
            orderBy: [{ sortOrder: 'asc' }],
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      },
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
): Promise<CollectionWithAuthorsAndStories> {
  // retrieve the current record, pre-update
  const existingCollection = await getCollection(db, data.externalId);

  if (!existingCollection) {
    throw new Error(`A collection by that ID could not be found`);
  }

  // if the slug is changing, we have to make sure it's unique
  // we could let this fall back to a db unique constraint, but probably good
  // to handle it here, too
  if (existingCollection.slug !== data.slug) {
    // make sure no other collections exist with the soon-to-be slug
    const sameSlugs = await db.collection.count({
      where: {
        slug: data.slug,
        externalId: { notIn: [existingCollection.externalId] },
      },
    });

    // if we found more than one collection with this slug, we have a problem
    if (sameSlugs > 0) {
      throw new Error(
        `A collection with the slug "${data.slug}" already exists`
      );
    }
  }

  // We have to pull the authorExternalId property out of data
  // because prisma's generated create/update types do not
  // have the authorExternalId as a property. We have it
  // as part of the mutation input to allow connecting
  // an author to a collection.
  const authorExternalId = data.authorExternalId;
  delete data.authorExternalId;

  // And we do the same thing for the curationCategoryExternalId
  // property
  const curationCategoryExternalId = data.curationCategoryExternalId;
  delete data.curationCategoryExternalId;

  // if the collection is going from unpublished to published, we update its
  // `publishedAt` time
  if (
    existingCollection.status !== CollectionStatus.PUBLISHED &&
    data.status === CollectionStatus.PUBLISHED
  ) {
    data.publishedAt = new Date();
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
      curationCategory: { connect: { externalId: curationCategoryExternalId } },
    },
    include: {
      authors: true,
      curationCategory: true,
      stories: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        include: {
          authors: {
            orderBy: [{ sortOrder: 'asc' }],
          },
        },
      },
    },
  });
}

export async function updateCollectionImageUrl(
  db: PrismaClient,
  data: UpdateCollectionImageUrlInput
): Promise<CollectionWithAuthorsAndStories> {
  if (!data.externalId) {
    throw new Error('externalId must be provided.');
  }

  // retrieve the current record, pre-update
  const existingCollection = await getCollection(db, data.externalId);

  if (!existingCollection) {
    throw new Error(`A collection by that ID could not be found`);
  }

  return db.collection.update({
    where: { externalId: data.externalId },
    data: { ...data },
    include: {
      authors: true,
      stories: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        include: {
          authors: {
            orderBy: [{ sortOrder: 'asc' }],
          },
        },
      },
    },
  });
}
