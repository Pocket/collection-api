import { Image, ImageEntityType, PrismaClient } from '@prisma/client';
import { CreateImageInput } from '../types';

/**
 * @param db
 * @param data
 */
export async function createImage(
  db: PrismaClient,
  data: CreateImageInput,
): Promise<Image> {
  return db.image.create({ data });
}

/**
 * @param db
 * @param entity
 * @param entityType
 */
export async function associateImageWithEntity<
  T extends { id: number; imageUrl: string },
>(
  db: PrismaClient,
  entity: T,
  entityType: ImageEntityType,
): Promise<Image | void> {
  if (!entity.imageUrl) return;

  const image = await db.image.findUnique({
    where: { path: entity.imageUrl },
  });

  if (image) {
    return await db.image.update({
      where: { id: image.id },
      data: { entityId: entity.id, entityType },
    });
  }
}
