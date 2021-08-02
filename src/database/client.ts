import { PrismaClient } from '@prisma/client';
import config from '../config';
import { collectionStoryInjectItemMiddleware } from '../middleware/prisma';

let prisma;

export function client(): PrismaClient {
  if (prisma) return prisma;

  // Always log errors
  const logOptions: any[] = ['error'];

  console.log(config.app.environment);
  // In the local dev environment, emit 'query' events
  if (config.app.environment == 'local') {
    logOptions.push({
      emit: 'event',
      level: 'query',
    });
  }

  prisma = new PrismaClient({
    log: logOptions,
  });

  // In the local dev environment, subscribe to the 'query' event
  // and send pertinent query details to the console.
  if (config.app.environment == 'local') {
    prisma.$on('query', (e) => {
      console.log(`Query: ${e.query}`);
      console.log(`Query params: ${e.params}`);
      console.log(`Duration: ${e.duration}ms \n`);
    });
  }

  // this is a middleware function that injects non-database / non-prisma
  // data into each CollectionStory. this extra data is necessary to relate
  // a CollectionStory with a parser Item.
  prisma.$use(collectionStoryInjectItemMiddleware);

  return prisma;
}
