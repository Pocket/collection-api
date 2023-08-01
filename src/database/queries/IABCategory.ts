import { PrismaClient } from '@prisma/client';
import { IABParentCategory } from '../types';

/**
 * returns a nested list of IAB categories and their children
 *
 * @param db
 */
export async function getIABCategories(
  db: PrismaClient,
): Promise<IABParentCategory[]> {
  return db.iABCategory.findMany({
    where: { IABCategoryId: null }, // only get the parents at this level
    include: {
      children: {
        orderBy: [{ slug: 'asc' }],
      },
    },
    orderBy: [{ slug: 'asc' }],
  });
}
