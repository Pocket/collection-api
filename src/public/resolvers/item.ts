import { Collection } from '@prisma/client';
import * as Sentry from '@sentry/node';
import { getCollectionUrlSlug } from '../../test/helpers';
import { serverLogger } from '../../express';

/**
 * @param givenUrl
 * @param _
 * @param dataLoaders
 */
export async function collection(
  { givenUrl },
  _,
  { dataLoaders },
): Promise<Collection> {
  try {
    const slug = getCollectionUrlSlug(givenUrl);

    if (slug) {
      return await dataLoaders.collectionLoader.load(slug);
    } else {
      return null;
    }
  } catch (err) {
    serverLogger.error(err);
    Sentry.captureException(err);
    throw err;
  }
}
