import { PrismaClient } from '@prisma/client';
import { collectionStoryInjectItemMiddleware } from '../middleware/prisma';

let prisma;

export function client(): PrismaClient {
  if (prisma) return prisma;

  // Always log errors
  const logOptions: any[] = ['error'];

  prisma = new PrismaClient({
    log: logOptions,
  });

  // this is a middleware function that injects non-database / non-prisma
  // data into each CollectionStory. this extra data is necessary to relate
  // a CollectionStory with a parser Item.
  prisma.$use(collectionStoryInjectItemMiddleware);

  return prisma;
}
