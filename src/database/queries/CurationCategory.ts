import { CurationCategory, PrismaClient } from '@prisma/client';

/**
 * @param db
 */
export async function getCurationCategories(
  db: PrismaClient,
): Promise<CurationCategory[]> {
  return db.curationCategory.findMany({
    orderBy: { name: 'asc' },
  });
}
