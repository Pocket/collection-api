import { CurationCategory, PrismaClient } from '@prisma/client';

/**
 * @param db
 * @param page
 * @param perPage
 */
export async function getCurationCategories(
  db: PrismaClient,
  page: number,
  perPage: number
): Promise<CurationCategory[]> {
  return db.curationCategory.findMany({
    take: perPage,
    skip: page > 1 ? (page - 1) * perPage : 0,
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
