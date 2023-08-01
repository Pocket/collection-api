import { getCollectionStory as dbGetCollectionStory } from '../../../database/queries';
import { CollectionStory } from '@prisma/client';
import { ACCESS_DENIED_ERROR } from '../../../shared/constants';
import { ForbiddenError, NotFoundError } from '@pocket-tools/apollo-utils';

/**
 * @param parent
 * @param externalId
 * @param db
 */
export async function getCollectionStory(
  parent,
  { externalId },
  { db, authenticatedUser },
): Promise<CollectionStory> {
  if (!authenticatedUser.canRead) {
    throw new ForbiddenError(ACCESS_DENIED_ERROR);
  }

  const story = await dbGetCollectionStory(db, externalId);

  if (!story) {
    throw new NotFoundError(externalId);
  }

  return story;
}
