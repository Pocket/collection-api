import { CollectionAuthor, PrismaClient } from '@prisma/client';

/**
 * @param db
 * @param externalId
 */
export async function getAuthor(
  db: PrismaClient,
  externalId: string,
): Promise<CollectionAuthor> {
  return db.collectionAuthor.findUnique({ where: { externalId } });
}

/**
 * @param db
 * @param page
 * @param perPage
 */
export async function getAuthors(
  db: PrismaClient,
  page: number,
  perPage: number,
): Promise<CollectionAuthor[]> {
  return db.collectionAuthor.findMany({
    take: perPage,
    skip: page > 1 ? (page - 1) * perPage : 0,
    orderBy: { name: 'asc' },
  });
}

/**
 * @param db
 */
export async function countAuthors(db: PrismaClient): Promise<number> {
  return db.collectionAuthor.count();
}
