import { getCollectionBySlug, getCollections } from './queries/Collection';
import { collection } from './item';
import {
  collectionPartnershipFieldResolvers,
  Image,
} from '../../shared/resolvers/types';
import { Collection, CollectionAuthor, CollectionStory } from '@prisma/client';

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
    async image(parent: Collection, _, { db }): Promise<Image> {
      return { url: parent.imageUrl };
    },
  },
  CollectionStory: {
    async image(parent: CollectionStory, _, { db }): Promise<Image> {
      return { url: parent.imageUrl };
    },
  },
  CollectionAuthor: {
    async image(parent: CollectionAuthor, _, { db }): Promise<Image> {
      return { url: parent.imageUrl };
    },
  },
};
