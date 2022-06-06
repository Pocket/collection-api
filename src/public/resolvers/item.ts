import { Collection } from '@prisma/client';
import * as Sentry from '@sentry/node';
import { getCollectionUrlSlug } from '../../test/helpers';

/**
 * @param givenUrl
 * @param _
 * @param dataLoaders
 */
export async function collection(
  { givenUrl },
  _,
  { dataLoaders }
): Promise<Collection> {
  try {
    // match only http(s)://getpocket.com/collections/<slug>
    const slug = getCollectionUrlSlug(givenUrl);

    return slug ? await dataLoaders.collectionLoader.load(slug) : null;
  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
    throw err;
  }
}
