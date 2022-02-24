import { PrismaClient } from '@prisma/client';
import { S3 } from 'aws-sdk';
import { Request } from 'express';
import { client } from '../database/client';
import s3service from '../aws/s3';
import { COLLECTION_CURATOR_FULL, READONLY } from '../shared/constants';

// Custom properties we get from Admin API for the authenticated user
export interface AdminAPIUser {
  name: string;
  groups: string[];
  username: string;
  // access to collections is failry basic - you can either do everything or only read
  hasFullAccess: boolean;
  canRead: boolean;
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
    // If anyone decides to work with/test the subgraph directly,
    // make sure we cater for undefined headers.
    const groups = this.config.request.headers.groups as string;
    const accessGroups = groups ? groups.split(',') : [];

    const hasFullAccess = accessGroups.includes(COLLECTION_CURATOR_FULL);
    const hasReadOnly = accessGroups.includes(READONLY);

    return {
      name: this.config.request.headers.name as string,
      username: this.config.request.headers.username as string,
      groups: accessGroups,
      hasFullAccess,
      canRead: hasReadOnly || hasFullAccess,
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
