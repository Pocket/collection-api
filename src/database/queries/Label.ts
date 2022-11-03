import { PrismaClient } from '@prisma/client';
import { Label } from '../types';

/**
 * Retrieves all available labels from the datastore.
 *
 * @param db
 */
export async function getLabels(db: PrismaClient): Promise<Label[]> {
  return db.label.findMany({
    orderBy: { name: 'asc' },
    select: {
      // Until we do more with labels, we only need to retrieve
      // the following two fields.
      externalId: true,
      name: true,
    },
  });
}
