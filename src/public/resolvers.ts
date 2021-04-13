import {
  CollectionWithAuthorsAndStories,
  countPublishedCollections,
  getCollection,
  getPublishedCollections,
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
