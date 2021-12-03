import DataLoader from 'dataloader';

import { PrismaClient, Collection } from '@prisma/client';

import { CollectionComplete } from '../database/types';
import { getCollectionsBySlugs } from '../database/queries';
import { client } from '../database/client';

/**
 * helper function to ensure collections are returned in the order of the
 * requested slugs
 *
 * localized/specialized version of this function from apollo-utils:
 * https://github.com/Pocket/apollo-utils/blob/890862f2b66b8179e706a1522ce8d07da67a7c94/src/dataloader.ts#L109
 *
 * @param slugs an array of slug strings
 * @param collections an array of CollectionComplete collections
 * @returns
 */
export const sortCollectionsByGivenSlugs = (
  slugs: string[],
  collections: CollectionComplete[]
): CollectionComplete[] => {
  // create a map of slugs to collections
  const slugToCollection = collections.reduce((acc, collection) => {
    if (collection) {
      return {
        ...acc,
        [collection.slug]: collection,
      };
    }

    return acc;
  }, {});

  // sort the map in the order of the provided slugs
  return slugs.map((slug) => {
    return slugToCollection[slug];
  });
};

/**
 * Grabs all collections from the database
 * @param slugs
 */
export const batchFetchBySlugs = async (
  slugs: string[]
): Promise<Collection[]> => {
  const db: PrismaClient = client();

  const collections = await getCollectionsBySlugs(db, slugs);

  return sortCollectionsByGivenSlugs(slugs, collections);
};

/**
 * Loader to batch requests
 */
export const collectionLoader = new DataLoader(batchFetchBySlugs, {
  cache: false,
});
