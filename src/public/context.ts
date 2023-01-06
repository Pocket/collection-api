import { PrismaClient } from '@prisma/client';
import { collectionLoader } from '../dataLoaders/collectionLoader';
import { client } from '../database/client';

/**
 * Context components specifically for the public graph.
 */

export interface IPublicContext {
  db: PrismaClient;
  dataLoaders: {
    collectionLoader: typeof collectionLoader;
  };
}

export class PublicContextManager implements IPublicContext {
  constructor(
    private config: {
      db: PrismaClient;
      collectionLoader: IPublicContext['dataLoaders']['collectionLoader'];
    }
  ) {}

  get db(): IPublicContext['db'] {
    return this.config.db;
  }

  get dataLoaders(): IPublicContext['dataLoaders'] {
    return {
      collectionLoader: this.config.collectionLoader,
    };
  }
}

/**
 * Context factory function. Creates a new context upon every request.
 * @param req server request
 *
 * @returns PublicContextManager
 */
export async function getPublicContext(): Promise<PublicContextManager> {
  return new PublicContextManager({
    collectionLoader,
    db: client(),
  });
}
