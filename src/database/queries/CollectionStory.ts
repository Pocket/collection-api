import { PrismaClient } from '@prisma/client';
import { CollectionStoryWithAuthors } from '../types';

/**
 * @param db
 * @param externalId
 */
export async function getCollectionStory(
  db: PrismaClient,
  externalId: string,
): Promise<CollectionStoryWithAuthors> {
  return await db.collectionStory.findUnique({
    where: { externalId },
    include: {
      authors: {
        orderBy: [{ sortOrder: 'asc' }],
      },
    },
  });
}
