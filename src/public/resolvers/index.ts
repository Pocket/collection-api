import { getCollectionBySlug, getCollections } from './queries/Collection';
import { collection } from './item';
import { collectionPartnershipFieldResolvers } from '../../shared/resolvers/types';

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
};
