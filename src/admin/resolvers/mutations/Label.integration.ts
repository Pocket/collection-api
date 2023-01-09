import { expect } from 'chai';
import { print } from 'graphql';
import request from 'supertest';
import { ApolloServer } from '@apollo/server';
import { PrismaClient } from '@prisma/client';
import { client } from '../../../database/client';

import { clear as clearDb, createLabelHelper } from '../../../test/helpers';
import { CREATE_LABEL } from './sample-mutations.gql';
import { COLLECTION_CURATOR_FULL } from '../../../shared/constants';
import { startServer } from '../../../express';
import { IAdminContext } from '../../context';

describe('mutations: Label', () => {
  let app: Express.Application;
  let server: ApolloServer<IAdminContext>;
  let graphQLUrl: string;
  let db: PrismaClient;

  const headers = {
    name: 'Test User',
    username: 'test.user@test.com',
    groups: `group1,group2,${COLLECTION_CURATOR_FULL}`,
  };

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

  describe('createLabel', () => {
    beforeAll(async () => {
      // Create some labels
      await createLabelHelper(db, 'simon-le-bon');
    });

    it('should create a new label', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(CREATE_LABEL),
          variables: { name: 'katerina-ch-1' },
        });
      expect(result.body.data.createLabel.name).to.equal('katerina-ch-1');
    });

    it('should not create label that already exists', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(CREATE_LABEL),
          variables: { name: 'simon-le-bon' },
        });
      expect(result.body.errors.length).to.equal(1);
      expect(result.body.errors[0].message).to.equal(
        `A label with the name "simon-le-bon" already exists`
      );
    });
  });
});
