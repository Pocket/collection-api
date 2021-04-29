import { Collection } from '@prisma/client';
import * as Sentry from '@sentry/node';

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
  // match only http(s)://getpocket.com/collections/<slug>
  const matches = /^https?:\/\/(?:getpocket\.com)\/collections\/(.*)/i.exec(
    givenUrl
  );

  // log it if there's no match
  if (!matches) {
    console.log(`${givenUrl} is not a collection`);
    return null;
  }

  try {
    return await dataLoaders.collectionLoader.load(matches[1]);
  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
    throw err;
  }
}
