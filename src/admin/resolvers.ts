import { CollectionAuthor, CollectionStory } from '@prisma/client';
import { CollectionsResult } from '../public/resolvers';

import {
  getAuthor,
  getCollectionStory,
  searchCollections,
} from '../database/queries';

export const resolvers = {
  Mutation: {
    createCollection: (_source, { data }) => {
      return {
        id: 1,
        slug: data.title.toLowerCase().replace(/\s+/g, '-'),
        title: data.title,
        excerpt: data.excerpt,
      };
    },
  },
  Query: {
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
      const collectionStory = await getCollectionStory(db, collectionId, url);

      return {
        ...collectionStory,
        authors: JSON.parse(collectionStory.authors),
      };
    },
  },
};
