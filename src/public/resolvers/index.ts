import { getCollectionBySlug, getCollections } from './queries';
import { collection } from './item';
import { collectionPartnershipFieldResolvers } from '../../admin/resolvers/types';

/**
 * Resolvers
 */
export const resolvers = {
  Query: {
    getCollectionBySlug,
    getCollections,
  },
  Item: {
    collection,
  },
  CollectionPartnership: collectionPartnershipFieldResolvers,
};
