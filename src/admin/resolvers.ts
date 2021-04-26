import {
  Collection,
  CollectionAuthor,
  CollectionStory,
  PrismaClient,
} from '@prisma/client';
import * as Sentry from '@sentry/node';
import { CollectionsResult, CollectionAuthorsResult } from '../typeDefs';
import { getPagination } from '../utils';
import {
  countAuthors,
  getAuthor,
  getAuthors,
  getCollectionStory,
  getCollection,
  searchCollections,
} from '../database/queries';
import {
  createAuthor,
  createCollection,
  createCollectionStory,
  deleteCollectionStory,
  updateAuthor,
  updateCollection,
  updateCollectionStory,
} from '../database/mutations';
import {
  CollectionWithAuthorsAndStories,
  CreateCollectionAuthorInput,
  CreateCollectionInput,
  CreateCollectionStoryInput,
  UpdateCollectionAuthorInput,
  UpdateCollectionInput,
  UpdateCollectionStoryInput,
} from '../database/types';
import config from '../config';

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
    createCollectionStory: async (
      _source,
      { data },
      { db }
    ): Promise<CollectionStory> => {
      return await executeMutation<CreateCollectionStoryInput, CollectionStory>(
        db,
        data,
        createCollectionStory
      );
    },
    updateCollectionStory: async (
      _source,
      { data },
      { db }
    ): Promise<CollectionStory> => {
      return await executeMutation<UpdateCollectionStoryInput, CollectionStory>(
        db,
        data,
        updateCollectionStory
      );
    },
    deleteCollectionStory: async (
      _source,
      { externalId },
      { db }
    ): Promise<CollectionStory> => {
      return await executeMutation<string, CollectionStory>(
        db,
        externalId,
        deleteCollectionStory
      );
    },
  },
  Query: {
    getCollection: async (
      _source,
      { externalId },
      { db }
    ): Promise<CollectionWithAuthorsAndStories> => {
      return await getCollection(db, externalId);
    },
    searchCollections: async (
      _source,
      { filters, page = 1, perPage = config.app.pagination.collectionsPerPage },
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
    getCollectionAuthors: async (
      _source,
      { page = 1, perPage = config.app.pagination.authorsPerPage },
      { db }
    ): Promise<CollectionAuthorsResult> => {
      const totalResults = await countAuthors(db);
      const authors = await getAuthors(db, page, perPage);

      return {
        pagination: getPagination(totalResults, page, perPage),
        authors,
      };
    },
    getCollectionAuthor: async (
      _source,
      { externalId },
      { db }
    ): Promise<CollectionAuthor> => {
      return await getAuthor(db, externalId);
    },
    getCollectionStory: async (
      _source,
      { externalId },
      { db }
    ): Promise<CollectionStory> => {
      const collectionStory = await getCollectionStory(db, externalId);

      return {
        ...collectionStory,
        authors: JSON.parse(collectionStory.authors),
      };
    },
  },
};
