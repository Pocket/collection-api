import {
  CollectionWithAuthorsAndStories,
  countPublishedCollections,
  getCollection,
  getPublishedCollections,
} from '../database/queries';
import { getPagination } from '../utils';
import { CollectionsResult } from '../typeDefs';
import { Collection } from '@prisma/client';
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
  Item: {
    collection: async (
      { givenUrl },
      _,
      { db, dataLoaders }
    ): Promise<Collection> => {
      // match only http(s)://getpocket.com/collections/<slug>
      const matches = /^https?:\/\/(?:getpocket\.com)\/collections\/(.*)/i.exec(
        givenUrl
      );

      // log it if there's no match
      if (!matches) {
        console.log(`${givenUrl} is not a collection`);
        return null;
      }

      try {
        return await dataLoaders.collectionLoader.load(matches[1]);
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
  },
};
