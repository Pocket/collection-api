import { expect } from 'chai';
import { print } from 'graphql';
import request from 'supertest';
import { ApolloServer } from '@apollo/server';
import { PrismaClient } from '@prisma/client';
import { client } from '../../../database/client';
import { CollectionLanguage, UpdateLabelInput } from '../../../database/types';
import {
  clear as clearDb,
  createLabelHelper,
  createAuthorHelper,
} from '../../../test/helpers';
import {
  CREATE_COLLECTION,
  CREATE_LABEL,
  UPDATE_LABEL,
} from './sample-mutations.gql';
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

    it('should successfully update the label', async () => {
      // create label first
      const resultCreate = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(CREATE_LABEL),
          variables: { name: 'fake-label-1' },
        });
      expect(resultCreate.body.data.createLabel.name).to.equal('fake-label-1');

      const input: UpdateLabelInput = {
        externalId: resultCreate.body.data.createLabel.externalId,
        name: 'fake-label-1-update',
      };

      const resultUpdate = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(UPDATE_LABEL),
          variables: { data: input },
        });
      expect(resultUpdate.body.data.updateLabel.name).to.equal(
        'fake-label-1-update'
      );
      expect(resultUpdate.body.data.updateLabel.externalId).to.equal(
        resultCreate.body.data.createLabel.externalId
      );
    });

    it('should throw an error when using an existing label name to update a label', async () => {
      // create label first
      const resultCreate = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(CREATE_LABEL),
          variables: { name: 'fake-label-2' },
        });
      expect(resultCreate.body.data.createLabel.name).to.equal('fake-label-2');

      const input: UpdateLabelInput = {
        externalId: resultCreate.body.data.createLabel.externalId,
        name: 'simon-le-bon',
      };

      const resultUpdate = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(UPDATE_LABEL),
          variables: { data: input },
        });
      expect(resultUpdate.body.data).not.to.exist;
      expect(resultUpdate.body.errors.length).to.equal(1);
      expect(resultUpdate.body.errors[0].message).to.equal(
        `A label with the name "simon-le-bon" already exists`
      );
    });

    it('should throw an error when updating a label attached to a collection', async () => {
      const author = await createAuthorHelper(db, 'walter');
      const label1 = await createLabelHelper(db, 'most-read');
      const minimumData = {
        authorExternalId: author.externalId,
        language: CollectionLanguage.EN,
        slug: 'walter-bowls',
        title: 'walter bowls',
      };

      // create collection first with label
      const resultCollection = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(CREATE_COLLECTION),
          variables: {
            data: {
              ...minimumData,
              labelExternalIds: [label1.externalId],
            },
          },
        });

      expect(
        resultCollection.body.data.createCollection.labels[0].externalId
      ).to.equal(label1.externalId);
      expect(
        resultCollection.body.data.createCollection.labels[0].name
      ).to.equal(label1.name);

      // try to update the label
      const input: UpdateLabelInput = {
        externalId: label1.externalId,
        name: 'fake-new-label-update',
      };

      const resultUpdate = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(UPDATE_LABEL),
          variables: { data: input },
        });
      expect(resultUpdate.body.data).not.to.exist;
      expect(resultUpdate.body.errors.length).to.equal(1);
      expect(resultUpdate.body.errors[0].message).to.equal(
        `Cannot update label; it is associated with at least one collection`
      );
    });
  });
});
