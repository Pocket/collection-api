import {
  CollectionAuthor,
  CollectionStory,
  PrismaClient,
} from '@prisma/client';
import slugify from 'slugify';
import * as Sentry from '@sentry/node';
import config from '../config';
import { CollectionsResult } from '../typeDefs';
import { getPagination } from '../utils';
import {
  getAuthor,
  getCollectionStory,
  searchCollections,
} from '../database/queries';

export const resolvers = {
  Mutation: {
    createCollectionAuthor: async (
      _source,
      { data },
      { db }: { db: PrismaClient }
    ) => {
      data.slug = slugify(data.name, config.slugify);

      try {
        if (await db.collectionAuthor.count({ where: { slug: data.slug } })) {
          throw new Error(`Author with slug "${data.slug}" already exists`);
        }

        return await db.collectionAuthor.create({ data });
      } catch (ex) {
        console.log(ex);
        Sentry.captureException(ex);
        throw new Error(ex);
      }
    },
    updateCollectionAuthor: async (
      _source,
      { data },
      { db }: { db: PrismaClient }
    ) => {
      if (!data.externalId) throw new Error('externalId must be provided.');

      data.slug = slugify(data.name, config.slugify);

      const slugExists = await db.collectionAuthor.count({
        where: { slug: data.slug, externalId: { not: data.externalId } },
      });

      if (slugExists) {
        throw new Error(`Author with slug "${data.slug}" already exists`);
      }

      return await db.collectionAuthor.update({
        where: { externalId: data.externalId },
        data,
      });
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
