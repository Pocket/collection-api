import { expect } from 'chai';
import { print } from 'graphql';
import request from 'supertest';
import { ApolloServer } from '@apollo/server';
import { PrismaClient } from '@prisma/client';
import { client } from '../../../database/client';

import { clear as clearDb, createLabelHelper } from '../../../test/helpers';
import { CREATE_LABEL, UPDATE_LABEL } from './sample-mutations.gql';
import {
  ACCESS_DENIED_ERROR,
  READONLY,
  FULLACCESS,
} from '../../../shared/constants';
import { startServer } from '../../../express';
import { IAdminContext } from '../../context';
import { UpdateLabelInput } from '../../../database/types';

describe('auth: Label', () => {
  let app: Express.Application;
  let server: ApolloServer<IAdminContext>;
  let graphQLUrl: string;
  let db: PrismaClient;
  let label1;

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

  describe('createLabel and updateLabel query', () => {
    beforeAll(async () => {
      // Create a label
      label1 = await createLabelHelper(db, 'simon-le-bon');
    });
    it('should succeed if a user has FULLACCESS access', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `${FULLACCESS}`,
      };

      // crete new label
      const resultCreate = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(CREATE_LABEL),
          variables: { name: 'katerina-ch-1' },
        });

      // we shouldn't have any errors
      expect(resultCreate.body.errors).not.to.exist;

      expect(resultCreate.body.data).to.exist;

      // update label simon-le-bon to simon-le-bon-update
      const input: UpdateLabelInput = {
        externalId: label1.externalId,
        name: 'simon-le-bon-update',
      };
      const resultUpdate = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(UPDATE_LABEL),
          variables: { data: input },
        });

      // we shouldn't have any errors
      expect(resultUpdate.body.errors).not.to.exist;

      expect(resultUpdate.body.data).to.exist;
    });
    it('should fail if a user has only READONLY access', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,${READONLY}`,
      };

      // crete new label
      const resultCreate = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(CREATE_LABEL),
          variables: { name: 'katerina-ch-1' },
        });

      expect(resultCreate.body.errors[0].message).to.equal(ACCESS_DENIED_ERROR);

      expect(resultCreate.body.data).not.to.exist;

      // update label simon-le-bon to simon-le-bon-update
      const input: UpdateLabelInput = {
        externalId: label1.externalId,
        name: 'simon-le-bon-update',
      };
      const resultUpdate = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(UPDATE_LABEL),
          variables: { data: input },
        });

      expect(resultUpdate.body.errors[0].message).to.equal(ACCESS_DENIED_ERROR);

      expect(resultUpdate.body.data).not.to.exist;
    });

    it('should fail if user does not have access', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2`,
      };

      // crete new label
      const resultCreate = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(CREATE_LABEL),
          variables: { name: 'katerina-ch-1' },
        });

      expect(resultCreate.body.errors[0].message).to.equal(ACCESS_DENIED_ERROR);

      expect(resultCreate.body.data).not.to.exist;

      // update label simon-le-bon to simon-le-bon-update
      const input: UpdateLabelInput = {
        externalId: label1.externalId,
        name: 'simon-le-bon-update',
      };
      const resultUpdate = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(UPDATE_LABEL),
          variables: { data: input },
        });

      expect(resultUpdate.body.errors[0].message).to.equal(ACCESS_DENIED_ERROR);

      expect(resultUpdate.body.data).not.to.exist;
    });

    it('should fail if auth headers are empty', async () => {
      // crete new label
      const resultCreate = await request(app)
        .post(graphQLUrl)
        .send({
          query: print(CREATE_LABEL),
          variables: { name: 'katerina-ch-1' },
        });

      expect(resultCreate.body.errors[0].message).to.equal(ACCESS_DENIED_ERROR);

      expect(resultCreate.body.data).not.to.exist;

      // update label simon-le-bon to simon-le-bon-update
      const input: UpdateLabelInput = {
        externalId: label1.externalId,
        name: 'simon-le-bon-update',
      };
      const resultUpdate = await request(app)
        .post(graphQLUrl)
        .send({
          query: print(UPDATE_LABEL),
          variables: { data: input },
        });

      expect(resultUpdate.body.errors[0].message).to.equal(ACCESS_DENIED_ERROR);

      expect(resultUpdate.body.data).not.to.exist;
    });
  });
});
