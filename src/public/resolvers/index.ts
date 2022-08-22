import { getCollectionBySlug, getCollections } from './queries/Collection';
import { collection } from './item';
import { collectionPartnershipFieldResolvers } from '../../shared/resolvers/types';
import { Collection, CollectionAuthor } from '@prisma/client';
import { getCollection } from '../../database/queries';

/**
 * Resolvers
 */
export const resolvers = {
  Query: {
    getCollectionBySlug,
    collectionBySlug: getCollectionBySlug,
    getCollections,
  },
  Item: {
    collection,
  },
  CollectionPartnership: collectionPartnershipFieldResolvers,
  Collection: {
    async image(parent: Collection, _, { db }): Promise<{ url: string }> {
      if (parent.imageUrl) {
        return { url: parent.imageUrl };
      } else {
        const collection = await getCollection(db, parent.externalId);
        return { url: collection.imageUrl };
      }
    },
  },
};
