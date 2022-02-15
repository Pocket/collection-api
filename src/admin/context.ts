import { PrismaClient } from '@prisma/client';
import { S3 } from 'aws-sdk';
import { Request } from 'express';
import { client } from '../database/client';
import s3service from '../aws/s3';
import { COLLECTION_CURATOR_FULL } from '../shared/constants';

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
  s3service: S3;
  authenticatedUser: AdminAPIUser;
}

export class ContextManager implements IContext {
  constructor(
    private config: {
      request: any;
      db: PrismaClient;
      s3service: S3;
    }
  ) {}

  get db(): IContext['db'] {
    return this.config.db;
  }

  get s3service(): IContext['s3service'] {
    return this.config.s3service;
  }

  get authenticatedUser(): AdminAPIUser {
    const accessGroups = this.config.request.headers.groups.split(',');

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
 * Context factory function. Creates a new context upon every request.
 * @param req server request
 *
 * @returns ContextManager
 */
export function getContext(req: Request): ContextManager {
  return new ContextManager({
    request: req,
    db: client(),
    s3service,
  });
}
