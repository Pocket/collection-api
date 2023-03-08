import { UserInputError } from '@pocket-tools/apollo-utils';
import { CollectionStatus, PrismaClient } from '@prisma/client';
import { getCollection } from '../queries';

import {
  CollectionComplete,
  CreateCollectionInput,
  UpdateCollectionImageUrlInput,
  UpdateCollectionInput,
} from '../types';
import { checkCollectionLabelLimit } from '../utils';
import { NotFoundError } from '@pocket-tools/apollo-utils';
import { AdminAPIUser } from '../../admin/context';
import { sendEventBridgeEvent } from '../../events/events';
import { EventBridgeEventType } from '../../events/types';

/**
 * @param db
 * @param data
 * @param authenticatedUser
 */
export async function createCollection(
  db: PrismaClient,
  data: CreateCollectionInput,
  authenticatedUser: AdminAPIUser
): Promise<CollectionComplete> {
  const slugExists = await db.collection.count({
    where: { slug: data.slug },
  });

  if (slugExists) {
    throw new UserInputError(
      `A collection with the slug "${data.slug}" already exists`
    );
  }

  // We have to pull the authorExternalId property out of data
  // because prisma's generated create/update types do not
  // have the authorExternalId as a property. We have it
  // as part of the mutation input to allow connecting
  // an author to a collection.
  const authorExternalId = data.authorExternalId;
  delete data.authorExternalId;

  // And we do the same thing for the curationCategoryExternalId
  // property (which may or may not exist)
  const curationCategoryExternalId = data.curationCategoryExternalId;
  delete data.curationCategoryExternalId;

  // And again with IAB categories
  const IABParentCategoryExternalId = data.IABParentCategoryExternalId;
  const IABChildCategoryExternalId = data.IABChildCategoryExternalId;
  delete data.IABParentCategoryExternalId;
  delete data.IABChildCategoryExternalId;

  // One more time with external IDs for labels
  const labelExternalIds = data.labelExternalIds;
  delete data.labelExternalIds;

  // we need to build dbData conditionally, as some entity connections may or
  // may not need to be created
  const dbData: any = {
    ...data,
    authors: { connect: { externalId: authorExternalId } },
  };

  // if a curation category was specified, set up the connection
  if (curationCategoryExternalId) {
    dbData.curationCategory = {
      connect: { externalId: curationCategoryExternalId },
    };
  }

  // if IAB categories were specified, set up those connections as well
  if (IABParentCategoryExternalId) {
    dbData.IABParentCategory = {
      connect: { externalId: IABParentCategoryExternalId },
    };

    if (IABChildCategoryExternalId) {
      dbData.IABChildCategory = {
        connect: { externalId: IABChildCategoryExternalId },
      };
    }
  }

  // if a collection has any labels, set up a connection to labels, too
  // first check if collection-label limit is not exceeded
  if (labelExternalIds) {
    // if exceeded, throw error
    checkCollectionLabelLimit(labelExternalIds);

    const connectIds = [];

    for (const id of labelExternalIds) {
      connectIds.push({
        label: { connect: { externalId: id } },
        createdBy: authenticatedUser.username,
      });
    }

    dbData.labels = { create: connectIds };
  }

  const collection = await db.collection.create({
    data: dbData,
    include: {
      authors: true,
      curationCategory: true,
      IABParentCategory: true,
      IABChildCategory: true,
      labels: true,
      // Note that partnership is included to conform to the return type - there
      // will never be a partnership set up at the time a collection is created.
      partnership: true,
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

  // send event bridge event for collection_created event type
  // note that we are only sending events for collections that are published or archived
  if (
    collection.status === CollectionStatus.PUBLISHED ||
    collection.status === CollectionStatus.ARCHIVED
  ) {
    await sendEventBridgeEvent(
      db,
      EventBridgeEventType.COLLECTION_CREATED,
      collection
    );
  }

  return collection;
}

/**
 * @param db
 * @param data
 * @param authenticatedUser
 */
export async function updateCollection(
  db: PrismaClient,
  data: UpdateCollectionInput,
  authenticatedUser: AdminAPIUser
): Promise<CollectionComplete> {
  // retrieve the current record, pre-update
  const existingCollection = await getCollection(db, data.externalId);

  if (!existingCollection) {
    throw new NotFoundError(`A collection by that ID could not be found`);
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
      throw new UserInputError(
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
  // property (this property may or  may not exist - the code below 'fails'
  // gracefully if it does not)
  const curationCategoryExternalId = data.curationCategoryExternalId;
  delete data.curationCategoryExternalId;

  // And the same thing for IAB categories
  const IABParentCategoryExternalId = data.IABParentCategoryExternalId;
  const IABChildCategoryExternalId = data.IABChildCategoryExternalId;
  delete data.IABParentCategoryExternalId;
  delete data.IABChildCategoryExternalId;

  // One more time with external IDs for labels
  const labelExternalIds = data.labelExternalIds;
  delete data.labelExternalIds;

  // if the collection is going from unpublished to published, we update its
  // `publishedAt` time
  if (
    existingCollection.status !== CollectionStatus.PUBLISHED &&
    data.status === CollectionStatus.PUBLISHED
  ) {
    data.publishedAt = new Date();
  }

  // we need to build dbData conditionally, as some entity connections may or
  // may not need to be created
  const dbData: any = {
    ...data,
    // reference: https://www.prisma.io/docs/concepts/components/prisma-client/relation-queries#disconnect-all-related-records
    // set: [] disconnects all authors from the collection
    // before connecting new authors, essentially a sync
    // of authors for a collection
    authors: { set: [], connect: { externalId: authorExternalId } },
  };

  // if a curation category was specified, set up the connection
  // otherwise, make sure no connection exists
  if (curationCategoryExternalId) {
    dbData.curationCategory = {
      connect: { externalId: curationCategoryExternalId },
    };
  } else {
    dbData.curationCategory = {
      disconnect: true,
    };
  }

  // same as above for IAB categories
  if (IABParentCategoryExternalId) {
    dbData.IABParentCategory = {
      connect: { externalId: IABParentCategoryExternalId },
    };

    // we'd only ever set the sub category if a top category is set
    if (IABChildCategoryExternalId) {
      dbData.IABChildCategory = {
        connect: { externalId: IABChildCategoryExternalId },
      };
    }
  } else {
    dbData.IABParentCategory = {
      disconnect: true,
    };

    dbData.IABChildCategory = {
      disconnect: true,
    };
  }

  /**
   *   Remove any previous labels attached to this collection.
   *
   *   Doing this in a canonical way, either with `disconnect` or `set`,
   *   results in the "The change you are trying to make would violate the required relation
   *   'CollectionToCollectionLabel' between the `Collection` and `CollectionLabel`" error.
   *
   *   This is most likely due to the many-to-many relationship here and the need for
   *   a linking table - other entities' relationships to Collection entity are either set up
   *   differently, or, in the case of CollectionPartnership, we never attempt to remove the link
   *   between Collection and CollectionPartner in a single throw-the-kitchen-sink-at-it update
   *   statement like the one we're constructing at the end of this method.
   */
  await db.collectionLabel.deleteMany({
    where: {
      collectionId: existingCollection.id,
    },
  });

  // If a collection has any labels, set up a connection to labels, too
  // first check if collection-label limit is not exceeded
  if (labelExternalIds) {
    // if exceeded, throw error
    checkCollectionLabelLimit(labelExternalIds);

    const connectIds = [];

    for (const id of labelExternalIds) {
      connectIds.push({
        label: { connect: { externalId: id } },
        createdBy: authenticatedUser.username,
      });
    }

    // First, unset links to any previous labels; then attach new labels.
    dbData.labels = { set: [], create: connectIds };
  }
  const collection = await db.collection.update({
    where: { externalId: data.externalId },
    data: dbData,
    include: {
      authors: true,
      curationCategory: true,
      IABChildCategory: true,
      IABParentCategory: true,
      partnership: true,
      labels: true,
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

  // send event bridge event for collection_updated event type
  // note that we are only sending events for collections that are published or archived
  if (
    collection.status === CollectionStatus.PUBLISHED ||
    collection.status === CollectionStatus.ARCHIVED
  ) {
    await sendEventBridgeEvent(
      db,
      EventBridgeEventType.COLLECTION_UPDATED,
      collection
    );
  }

  return collection;
}

export async function updateCollectionImageUrl(
  db: PrismaClient,
  data: UpdateCollectionImageUrlInput
): Promise<CollectionComplete> {
  if (!data.externalId) {
    throw new UserInputError('externalId must be provided.');
  }

  // retrieve the current record, pre-update
  const existingCollection = await getCollection(db, data.externalId);

  if (!existingCollection) {
    throw new NotFoundError(`A collection by that ID could not be found`);
  }

  return db.collection.update({
    where: { externalId: data.externalId },
    data: { ...data },
    include: {
      authors: true,
      curationCategory: true,
      IABChildCategory: true,
      IABParentCategory: true,
      partnership: true,
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
