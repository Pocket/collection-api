import { CurationCategory, PrismaClient } from '@prisma/client';

/**
 * @param db
 */
export async function getCurationCategories(
  db: PrismaClient
): Promise<CurationCategory[]> {
  return db.curationCategory.findMany({
    orderBy: { name: 'asc' },
  });
}

/**
 * @param db
 */
export async function countCurationCategories(
  db: PrismaClient
): Promise<number> {
  return db.curationCategory.count();
}
