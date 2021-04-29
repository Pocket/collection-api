import {getCollectionBySlug, getCollections} from './queries';
import {collection} from './item';

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
  }
};
