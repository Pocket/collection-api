import { CollectionPartner, PrismaClient } from '@prisma/client';

/**
 * @param db
 * @param externalId
 */
export async function getPartner(
  db: PrismaClient,
  externalId: string
): Promise<CollectionPartner> {
  return db.collectionPartner.findUnique({ where: { externalId } });
}

/**
 * @param db
 * @param page
 * @param perPage
 */
export async function getPartners(
  db: PrismaClient,
  page: number,
  perPage: number
): Promise<CollectionPartner[]> {
  return db.collectionPartner.findMany({
    take: perPage,
    skip: page > 1 ? (page - 1) * perPage : 0,
    orderBy: { name: 'asc' },
  });
}

/**
 * @param db
 */
export async function countPartners(db: PrismaClient): Promise<number> {
  return db.collectionPartner.count();
}
