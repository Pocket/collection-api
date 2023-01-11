import { expect } from 'chai';
import { print } from 'graphql';
import request from 'supertest';
import { ApolloServer } from '@apollo/server';
import { PrismaClient } from '@prisma/client';
import { client } from '../../../database/client';

import {
  clear as clearDb,
  createCurationCategoryHelper,
} from '../../../test/helpers';
import { GET_CURATION_CATEGORIES } from './sample-queries.gql';
import { ACCESS_DENIED_ERROR, READONLY } from '../../../shared/constants';
import { startServer } from '../../../express';
import { IAdminContext } from '../../context';

describe('auth: CurationCategory', () => {
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
    await db.$disconnect();
    await server.stop();
  });

  describe('getCurationCategories query', () => {
    beforeAll(async () => {
      // Create some curation categories
      await createCurationCategoryHelper(db, 'Technology');
      await createCurationCategoryHelper(db, 'Business');
      await createCurationCategoryHelper(db, 'Food and Drink');
      await createCurationCategoryHelper(db, 'Climate Change');
    });

    it('should succeed if a user has only READONLY access', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        // missing any collection/readoly group
        groups: `group1,group2,${READONLY}`,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(GET_CURATION_CATEGORIES) });
      // we shouldn't have any errors
      expect(result.body.errors).not.to.exist;

      // and data should exist
      expect(result.body.data).to.exist;
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
        .send({ query: print(GET_CURATION_CATEGORIES) });
      // ...without success. There is no data
      expect(result.body.data).not.to.exist;

      // And there is an access denied error
      expect(result.body.errors[0].message).to.equal(ACCESS_DENIED_ERROR);
      expect(result.body.errors[0].extensions.code).to.equal('FORBIDDEN');
    });

    it('should fail if auth headers are empty', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .send({ query: print(GET_CURATION_CATEGORIES) });
      // ...without success. There is no data
      expect(result.body.data).not.to.exist;

      // And there is an access denied error
      expect(result.body.errors[0].message).to.equal(ACCESS_DENIED_ERROR);
      expect(result.body.errors[0].extensions.code).to.equal('FORBIDDEN');
    });
  });
});
