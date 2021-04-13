import {
  CollectionWithAuthorsAndStories,
  countPublishedCollections,
  getCollection,
  getPublishedCollections,
} from '../database/queries';
import { getPagination } from '../utils';
import { CollectionsResult } from '../typeDefs';

/**
 * Resolvers
 */
export const resolvers = {
  Query: {
    getCollection: async (
      _source,
      { slug },
      { db }
    ): Promise<CollectionWithAuthorsAndStories> => {
      return await getCollection(db, slug);
    },
    getCollections: async (
      _source,
      { page = 1, perPage = 30 },
      { db }
    ): Promise<CollectionsResult> => {
      const totalResults = await countPublishedCollections(db);
      const collections = await getPublishedCollections(db, page, perPage);

      return {
        pagination: getPagination(totalResults, page, perPage),
        collections,
      };
    },
  },
};
