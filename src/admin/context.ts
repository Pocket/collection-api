import { PrismaClient } from '@prisma/client';
import { S3 } from 'aws-sdk';
import { Request } from 'express';
import { client } from '../database/client';
import s3 from '../aws/s3';

// Custom properties we get from Admin API for the authenticated user
export interface AdminAPIUser {
  name: string;
  groups: string[];
  username: string;
  // and one property we add for convenience as access to Collections is not granular
  hasFullAccess: boolean;
}

// Context interface
export interface IContext {
  db: PrismaClient;
  s3: S3;
  authenticatedUser: AdminAPIUser;
}

export class ContextManager implements IContext {
  constructor(
    private config: {
      request: any;
      db: PrismaClient;
      s3: S3;
    }
  ) {}

  get db(): IContext['db'] {
    return this.config.db;
  }

  get s3(): IContext['s3'] {
    return this.config.s3;
  }

  get authenticatedUser(): AdminAPIUser {
    const accessGroups = this.config.request.headers.groups.split(',');

    // Only using one value from MozillaAccessGroup enum in Pocket Shared Data
    const COLLECTION_CURATOR_FULL =
      'mozilliansorg_pocket_collection_curator_full';

    const hasFullAccess = accessGroups.includes(COLLECTION_CURATOR_FULL);

    return {
      name: this.config.request.headers.name,
      username: this.config.request.headers.username,
      groups: accessGroups,
      hasFullAccess,
    };
  }
}

/**
 * Context factory function. Creates a new context upon
 * every request.
 * @param req server request
 * @param db PrismaClient
 * @param s3 AWS S3 service object
 *
 * @returns ContextManager
 */
export function getContext(req: Request): ContextManager {
  return new ContextManager({
    request: req,
    db: client(),
    s3,
  });
}
