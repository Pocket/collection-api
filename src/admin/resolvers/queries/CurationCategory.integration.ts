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
import { COLLECTION_CURATOR_FULL } from '../../../shared/constants';
import { startServer } from '../../../express';
import { IAdminContext } from '../../context';

describe('queries: CurationCategory', () => {
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

  const headers = {
    name: 'Test User',
    username: 'test.user@test.com',
    groups: `group1,group2,${COLLECTION_CURATOR_FULL}`,
  };

  describe('getCurationCategories query', () => {
    beforeAll(async () => {
      // Create some curation categories
      await createCurationCategoryHelper(db, 'Technology');
      await createCurationCategoryHelper(db, 'Business');
      await createCurationCategoryHelper(db, 'Food and Drink');
      await createCurationCategoryHelper(db, 'Climate Change');
    });

    it('should get curation categories in alphabetical order', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(GET_CURATION_CATEGORIES) });
      const data = result.body.data.getCurationCategories;

      expect(data[0].name).to.equal('Business');
      expect(data[1].name).to.equal('Climate Change');
      expect(data[2].name).to.equal('Food and Drink');
      expect(data[3].name).to.equal('Technology');
    });

    it('should get all available properties of curation categories', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(GET_CURATION_CATEGORIES) });
      const data = result.body.data.getCurationCategories;

      expect(data[0].externalId).to.exist;
      expect(data[0].name).to.exist;
      expect(data[0].slug).to.exist;
    });
  });
});
