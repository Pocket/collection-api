import DataLoader from 'dataloader';
import { getCollectionsBySlugs } from '../database/queries';
import { PrismaClient } from '@prisma/client';
import { client } from '../database/client';

/**
 * Grabs all collections from the database
 * @param slugs
 */
export const batchFetchBySlugs = async (slugs: string[]): Promise<any> => {
  const db: PrismaClient = client();

  return await getCollectionsBySlugs(db, slugs);
};

/**
 * Loader to batch requests
 */
export const collectionLoader = new DataLoader(batchFetchBySlugs, {
  cache: false,
});
