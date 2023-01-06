import { expect } from 'chai';
import { print } from 'graphql';
import request from 'supertest';
import { ApolloServer } from '@apollo/server';
import { PrismaClient } from '@prisma/client';
import { client } from '../../../database/client';

import { CollectionStatus } from '@prisma/client';
import { clear as clearDb } from '../../../test/helpers';
import {
  ACCESS_DENIED_ERROR,
  COLLECTION_CURATOR_FULL,
  READONLY,
} from '../../../shared/constants';
import { GET_COLLECTION, SEARCH_COLLECTIONS } from './sample-queries.gql';
import { startServer } from '../../../express';
import { IAdminContext } from '../../context';

// for auth tests, we are only validating success/errors on the query itself.
// either a user can see all data or can see no data.
// data-related tests can be found in the associated integration test file.
describe('auth: Collection', () => {
  let app: Express.Application;
  let server: ApolloServer<IAdminContext>;
  let graphQLUrl: string;
  let db: PrismaClient;

  beforeAll(async () => {
    // port 0 tells express to dynamically assign an available port
    ({ app, adminServer: server, adminUrl: graphQLUrl } = await startServer(0));
    db = client();
    await clearDb(db);
  });

  afterAll(async () => {
    await server.stop();
  });

  describe('getCollection', () => {
    const collectionExternalId =
      'ifAGuidIsCreatedInADatabaseButNoOneSeesItDoesItExist?';

    it('should fail if auth headers are missing', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .send({
          query: print(GET_COLLECTION),
          variables: {
            externalId: collectionExternalId,
          },
        });

      expect(result.body.data.getCollection).not.to.exist;
      expect(result.body.errors[0].message).to.equal(ACCESS_DENIED_ERROR);
      expect(result.body.errors[0].extensions.code).to.equal('FORBIDDEN');
    });

    it('should fail if user does not have access', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        // missing any collection/readoly group
        groups: `group1,group2`,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(GET_COLLECTION),
          variables: {
            externalId: collectionExternalId,
          },
        });

      expect(result.body.data.getCollection).not.to.exist;
      expect(result.body.errors[0].message).to.equal(ACCESS_DENIED_ERROR);
      expect(result.body.errors[0].extensions.code).to.equal('FORBIDDEN');
    });

    it('should succeed if user has read only access', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${READONLY}`,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(GET_COLLECTION),
          variables: {
            externalId: collectionExternalId,
          },
        });

      // we should get a not found error instead of a forbidden error
      expect(result.body.errors.length).to.equal(1);
      expect(result.body.errors[0].extensions.code).to.equal('NOT_FOUND');
    });

    it('should succeed if user has full access', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${COLLECTION_CURATOR_FULL}`,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(GET_COLLECTION),
          variables: {
            externalId: collectionExternalId,
          },
        });

      // we should get a not found error instead of a forbidden error
      expect(result.body.errors.length).to.equal(1);
      expect(result.body.errors[0].extensions.code).to.equal('NOT_FOUND');
    });
  });

  describe('searchCollections', () => {
    it('should fail if auth headers are missing', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .send({
          query: print(SEARCH_COLLECTIONS),
          variables: {
            filters: {
              status: CollectionStatus.PUBLISHED,
            },
          },
        });

      expect(result.body.data).not.to.exist;
      expect(result.body.errors[0].message).to.equal(ACCESS_DENIED_ERROR);
      expect(result.body.errors[0].extensions.code).to.equal('FORBIDDEN');
    });

    it('should fail if user does not have access', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        // missing any collection/readoly group
        groups: `group1,group2`,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(SEARCH_COLLECTIONS),
          variables: {
            filters: {
              status: CollectionStatus.PUBLISHED,
            },
          },
        });

      expect(result.body.data).not.to.exist;
      expect(result.body.errors[0].message).to.equal(ACCESS_DENIED_ERROR);
      expect(result.body.errors[0].extensions.code).to.equal('FORBIDDEN');
    });

    it('should succeed if user has read only access', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${READONLY}`,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(SEARCH_COLLECTIONS),
          variables: {
            filters: {
              status: CollectionStatus.PUBLISHED,
            },
          },
        });

      expect(result.body.data).to.exist;
      expect(result.body.errors).not.to.exist;
    });

    it('should succeed if user has full access', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${COLLECTION_CURATOR_FULL}`,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(SEARCH_COLLECTIONS),
          variables: {
            filters: {
              status: CollectionStatus.PUBLISHED,
            },
          },
        });

      expect(result.body.data).to.exist;
      expect(result.body.errors).not.to.exist;
    });
  });
});
