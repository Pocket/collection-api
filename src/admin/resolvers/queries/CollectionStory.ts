import { getCollectionStory as dbGetCollectionStory } from '../../../database/queries';
import { CollectionStory } from '@prisma/client';
import { ACCESS_DENIED_ERROR } from '../../../shared/constants';

/**
 * @param parent
 * @param externalId
 * @param db
 */
export async function getCollectionStory(
  parent,
  { externalId },
  { db, authenticatedUser }
): Promise<CollectionStory> {
  if (!authenticatedUser.canRead) {
    throw new Error(ACCESS_DENIED_ERROR);
  }

  return await dbGetCollectionStory(db, externalId);
}
