import {
  Collection,
  CollectionAuthor,
  CollectionStory,
  PrismaClient,
} from '@prisma/client';
import * as Sentry from '@sentry/node';
import { CollectionsResult } from '../typeDefs';
import { getPagination } from '../utils';
import {
  getAuthor,
  getCollectionStory,
  searchCollections,
} from '../database/queries';
import {
  createAuthor,
  createCollection,
  CreateCollectionAuthorInput,
  CreateCollectionInput,
  updateAuthor,
  updateCollection,
  UpdateCollectionAuthorInput,
  UpdateCollectionInput,
} from '../database/mutations';

/**
 * Executes a mutation, catches exceptions and records to sentry and console
 * @param db
 * @param data
 * @param callback
 */
async function executeMutation<T, U>(
  db: PrismaClient,
  data: T,
  callback: (db: PrismaClient, data: T) => Promise<U>
): Promise<U> {
  try {
    return await callback(db, data);
  } catch (ex) {
    console.log(ex);
    Sentry.captureException(ex);
    throw new Error(ex);
  }
}

export const resolvers = {
  Mutation: {
    createCollectionAuthor: async (
      _source,
      { data },
      { db }
    ): Promise<CollectionAuthor> => {
      return await executeMutation<
        CreateCollectionAuthorInput,
        CollectionAuthor
      >(db, data, createAuthor);
    },
    updateCollectionAuthor: async (
      _source,
      { data },
      { db }
    ): Promise<CollectionAuthor> => {
      return await executeMutation<
        UpdateCollectionAuthorInput,
        CollectionAuthor
      >(db, data, updateAuthor);
    },
    createCollection: async (
      _source,
      { data },
      { db }
    ): Promise<Collection> => {
      return await executeMutation<CreateCollectionInput, Collection>(
        db,
        data,
        createCollection
      );
    },
    updateCollection: async (
      _source,
      { data },
      { db }
    ): Promise<Collection> => {
      return await executeMutation<UpdateCollectionInput, Collection>(
        db,
        data,
        updateCollection
      );
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
