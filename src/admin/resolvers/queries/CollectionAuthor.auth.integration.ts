import { expect } from 'chai';
import { print } from 'graphql';
import request from 'supertest';
import { ApolloServer } from '@apollo/server';
import { PrismaClient } from '@prisma/client';
import { client } from '../../../database/client';

import slugify from 'slugify';
import { faker } from '@faker-js/faker';
import { CollectionAuthor } from '@prisma/client';
import config from '../../../config';
import { clear as clearDb, createAuthorHelper } from '../../../test/helpers';
import { CreateCollectionAuthorInput } from '../../../database/types';
import {
  GET_COLLECTION_AUTHOR,
  GET_COLLECTION_AUTHORS,
} from './sample-queries.gql';
import { ACCESS_DENIED_ERROR, READONLY } from '../../../shared/constants';
import { startServer } from '../../../express';
import { IAdminContext } from '../../context';

describe('auth: CollectionAuthor', () => {
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

  describe('getCollectionAuthors query', () => {
    beforeAll(async () => {
      // Create some authors
      await createAuthorHelper(db, 'William Shakespeare');

      // Let's specify all props for this one to be able to test it later
      const name = 'Agatha Christie';
      const data: CreateCollectionAuthorInput = {
        name,
        slug: slugify(name, config.slugify),
        bio: faker.lorem.paragraphs(2),
        imageUrl: faker.image.url(),
        active: true,
      };
      await db.collectionAuthor.create({ data });

      await createAuthorHelper(db, 'Alexander Pushkin');
      await createAuthorHelper(db, 'René Goscinny');
      await createAuthorHelper(db, 'J. R. R. Tolkien');
      await createAuthorHelper(db, 'Carl Sagan');
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
        .send({ query: print(GET_COLLECTION_AUTHORS) });
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
        .send({ query: print(GET_COLLECTION_AUTHORS) });
      // ...without success. There is no data
      expect(result.body.data).not.to.exist;

      // And there is an access denied error
      expect(result.body.errors[0].message).to.equal(ACCESS_DENIED_ERROR);
      expect(result.body.errors[0].extensions.code).to.equal('FORBIDDEN');
    });

    it('should fail if auth headers are empty', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .send({ query: print(GET_COLLECTION_AUTHORS) });
      // ...without success. There is no data
      expect(result.body.data).not.to.exist;

      // And there is an access denied error
      expect(result.body.errors[0].message).to.equal(ACCESS_DENIED_ERROR);
      expect(result.body.errors[0].extensions.code).to.equal('FORBIDDEN');
    });
  });

  describe('getCollectionAuthor query', () => {
    let author: CollectionAuthor;

    beforeAll(async () => {
      const name = 'Anna Burns';
      const data: CreateCollectionAuthorInput = {
        name,
        slug: slugify(name, config.slugify),
        bio: faker.lorem.paragraphs(2),
        imageUrl: faker.image.url(),
        active: true,
      };
      author = await db.collectionAuthor.create({ data });
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
        .send({
          query: print(GET_COLLECTION_AUTHOR),
          variables: { id: author.externalId },
        });

      // we shouldn't have any errors
      expect(result.body.errors).not.to.exist;

      // and data should exist
      expect(result.body.data.getCollectionAuthor).to.exist;
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
          query: print(GET_COLLECTION_AUTHOR),
          variables: { id: author.externalId },
        });

      // ...without success. There is no data
      expect(result.body.data.getCollectionAuthor).not.to.exist;

      // And there is an access denied error
      expect(result.body.errors[0].message).to.equal(ACCESS_DENIED_ERROR);
      expect(result.body.errors[0].extensions.code).to.equal('FORBIDDEN');
    });

    it('should fail if auth headers are empty', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .send({
          query: print(GET_COLLECTION_AUTHOR),
          variables: { id: author.externalId },
        });

      // ...without success. There is no data
      expect(result.body.data.getCollectionAuthor).not.to.exist;

      // And there is an access denied error
      expect(result.body.errors[0].message).to.equal(ACCESS_DENIED_ERROR);
      expect(result.body.errors[0].extensions.code).to.equal('FORBIDDEN');
    });
  });
});
