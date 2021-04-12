import { CollectionAuthor, CollectionStory } from '@prisma/client';

import {
  CollectionWithAuthorsAndStories,
  countPublishedCollections,
  getAuthor,
  getCollection,
  getCollectionStory,
  getPublishedCollections,
  searchCollections,
} from '../database/queries';

export type CollectionsResult = {
  pagination: {
    totalResults: number;
    totalPages: number;
    currentPage: number;
    perPage: number;
  };
  collections: CollectionWithAuthorsAndStories[];
};

/**
 * Returns the pagination response object
 * @param totalResults
 * @param page
 * @param perPage
 */
function getPagination(totalResults, page, perPage) {
  return {
    currentPage: page,
    totalPages: Math.ceil(totalResults / perPage),
    totalResults,
    perPage,
  };
}

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
    getCollectionAuthor: async (
      _source,
      { id },
      { db }
    ): Promise<CollectionAuthor> => {
      return await getAuthor(db, id);
    },
    getCollectionStory: async (
      _source,
      { collectionId, url },
      { db }
    ): Promise<CollectionStory> => {
      const collectionStory = await getCollectionStory(
        db,
        collectionId,
        url
      );

      return {
        ...collectionStory,
        authors: JSON.parse(collectionStory.authors),
      };
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
    searchCollections: async (
      _source,
      { filters, page, perPage },
      { db }
    ): Promise<CollectionsResult> => {
      if (!filters || (!filters.author && !filters.title && !filters.status)) {
        throw new Error(
          `At least one filter('author', 'title', 'status') is required`
        );
      }

      const totalResults = (await searchCollections(db, filters)).length;
      const collections = await searchCollections(db, filters, page, perPage);

      return {
        pagination: getPagination(totalResults, page, perPage),
        collections,
      };
    },
  },
};
