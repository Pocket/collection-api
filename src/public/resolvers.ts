import { CollectionWithAuthorsAndStories } from '../database/queries';

import {
  countPublishedCollections,
  getAuthor,
  getCollection,
  getCollectionStory,
  getPublishedCollections,
  searchCollections,
} from '../database/queries';

export enum CollectionStatus {
  draft = 'draft',
  published = 'published',
  archived = 'archived',
}

export type Author = {};

export type CollectionStory = {};

export type Collection = {
  id: number;
  externalId: string;
  slug: string;
  title: string;
  excerpt: string;
  status: CollectionStatus;
  intro: string;
  imageUrl: string;
  publishedAt: string;
  authors: Author[];
  stories: CollectionStory[];
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
      const collection = await getCollection(db, slug);

      return {
        ...collection,
        collectionStories: collection.collectionStories,
      };
    },
    getCollectionAuthor: async (_source, { id }, { db }) => {
      return await getAuthor(db, id);
    },
    getCollectionStory: async (_source, { collectionId, storyId }, { db }) => {
      const collectionStory = await getCollectionStory(
        db,
        collectionId,
        storyId
      );

      return {
        ...collectionStory,
        url: collectionStory.story.url,
        authors: JSON.parse(collectionStory.authors),
      };
    },
    getCollections: async (_source, { page = 1, perPage = 30 }, { db }) => {
      const totalResults = await countPublishedCollections(db);

      const collections = (
        await getPublishedCollections(db, page, perPage)
      ).map((collection) => ({
        ...collection,
        stories: collection.collectionStories,
      }));

      return {
        pagination: getPagination(totalResults, page, perPage),
        collections,
      };
    },
    searchCollections: async (_source, { filters, page, perPage }, { db }) => {
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
