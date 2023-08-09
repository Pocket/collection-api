import { PrismaClient } from '@prisma/client';
import { S3 } from '@aws-sdk/client-s3';
import Express from 'express';
import { client } from '../database/client';
import s3service from '../aws/s3';
import { COLLECTION_CURATOR_FULL, READONLY } from '../shared/constants';

/**
 * Context components specifically for the admin graph.
 */

// Custom properties we get from Admin API for the authenticated user
export interface AdminAPIUser {
  name: string;
  groups: string[];
  username: string;
  // access to collections is fairly basic - you can either do everything or only read
  hasFullAccess: boolean;
  canRead: boolean;
}

export interface IAdminContext {
  db: PrismaClient;
  s3service: S3;
  authenticatedUser: AdminAPIUser;
}

export class AdminContextManager implements IAdminContext {
  constructor(
    private config: {
      request: Express.Request;
      db: PrismaClient;
      s3service: S3;
    },
  ) {}

  get db(): IAdminContext['db'] {
    return this.config.db;
  }

  get s3service(): IAdminContext['s3service'] {
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
 * @returns AdminContextManager
 */
export async function getAdminContext({
  req,
}: {
  req: Express.Request;
}): Promise<AdminContextManager> {
  return new AdminContextManager({
    request: req,
    db: client(),
    s3service,
  });
}
