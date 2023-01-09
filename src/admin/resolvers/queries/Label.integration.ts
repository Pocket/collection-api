import { expect } from 'chai';
import { print } from 'graphql';
import request from 'supertest';
import { ApolloServer } from '@apollo/server';
import { PrismaClient } from '@prisma/client';
import { client } from '../../../database/client';

import { clear as clearDb, createLabelHelper } from '../../../test/helpers';
import { LABELS } from './sample-queries.gql';
import { COLLECTION_CURATOR_FULL } from '../../../shared/constants';
import { startServer } from '../../../express';
import { IAdminContext } from '../../context';

describe('queries: Label', () => {
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

  describe('labels query', () => {
    beforeAll(async () => {
      // Create some labels
      await createLabelHelper(db, 'simon-le-bon');
      await createLabelHelper(db, 'leonard-cohen');
      await createLabelHelper(db, 'john-bon-jovi');
    });

    it('should get labels in alphabetical order', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(LABELS) });
      const data = result.body.data.labels;

      expect(data[0].name).to.equal('john-bon-jovi');
      expect(data[1].name).to.equal('leonard-cohen');
      expect(data[2].name).to.equal('simon-le-bon');
    });

    it('should get all publicly available properties of labels', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(LABELS) });
      const data = result.body.data.labels;

      expect(data[0].externalId).to.exist;
      expect(data[0].name).to.exist;
    });
  });
});
