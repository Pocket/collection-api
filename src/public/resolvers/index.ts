import {
  getCollectionBySlug,
  getCollections,
  resolveReference,
} from './queries/Collection';
import { collection } from './item';
import {
  collectionLabelsFieldResolvers,
  collectionPartnershipFieldResolvers,
} from '../../shared/resolvers/types';

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
  Collection: {
    __resolveReference: resolveReference,
  },
  CollectionPartnership: collectionPartnershipFieldResolvers,
  Label: collectionLabelsFieldResolvers,
};
