import { expect } from 'chai';
import slugify from 'slugify';
import { faker } from '@faker-js/faker';
import { CollectionAuthor } from '@prisma/client';
import config from '../../../config';
import { db, getServer } from '../../../test/admin-server';
import {
  clear as clearDb,
  createAuthorHelper,
  getServerWithMockedHeaders,
} from '../../../test/helpers';
import { CreateCollectionAuthorInput } from '../../../database/types';
import {
  GET_COLLECTION_AUTHOR,
  GET_COLLECTION_AUTHORS,
} from './sample-queries.gql';
import { ACCESS_DENIED_ERROR, READONLY } from '../../../shared/constants';

describe('auth: CollectionAuthor', () => {
  beforeAll(async () => {
    await clearDb(db);
  });

  afterAll(async () => {
    await db.$disconnect();
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
        imageUrl: faker.image.imageUrl(),
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

      const server = getServerWithMockedHeaders(headers);

      const result = await server.executeOperation({
        query: GET_COLLECTION_AUTHORS,
      });

      // we shouldn't have any errors
      expect(result.errors).not.to.exist;

      // and data should exist
      expect(result.data).to.exist;
    });

    it('should fail if user does not have access', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        // missing any collection/readoly group
        groups: `group1,group2`,
      };

      const server = getServerWithMockedHeaders(headers);

      const result = await server.executeOperation({
        query: GET_COLLECTION_AUTHORS,
      });

      // ...without success. There is no data
      expect(result.data).not.to.exist;

      // And there is an access denied error
      expect(result.errors[0].message).to.equal(ACCESS_DENIED_ERROR);
      expect(result.errors[0].extensions.code).to.equal('FORBIDDEN');
    });

    it('should fail if auth headers are empty', async () => {
      const server = getServer();

      const result = await server.executeOperation({
        query: GET_COLLECTION_AUTHORS,
      });

      // ...without success. There is no data
      expect(result.data).not.to.exist;

      // And there is an access denied error
      expect(result.errors[0].message).to.equal(ACCESS_DENIED_ERROR);
      expect(result.errors[0].extensions.code).to.equal('FORBIDDEN');
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
        imageUrl: faker.image.imageUrl(),
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

      const server = getServerWithMockedHeaders(headers);

      const result = await server.executeOperation({
        query: GET_COLLECTION_AUTHOR,
        variables: { id: author.externalId },
      });

      // we shouldn't have any errors
      expect(result.errors).not.to.exist;

      // and data should exist
      expect(result.data.getCollectionAuthor).to.exist;
    });

    it('should fail if user does not have access', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        // missing any collection/readoly group
        groups: `group1,group2`,
      };

      const server = getServerWithMockedHeaders(headers);

      const result = await server.executeOperation({
        query: GET_COLLECTION_AUTHOR,
        variables: { id: author.externalId },
      });

      // ...without success. There is no data
      expect(result.data.getCollectionAuthor).not.to.exist;

      // And there is an access denied error
      expect(result.errors[0].message).to.equal(ACCESS_DENIED_ERROR);
      expect(result.errors[0].extensions.code).to.equal('FORBIDDEN');
    });

    it('should fail if auth headers are empty', async () => {
      const server = getServer();

      const result = await server.executeOperation({
        query: GET_COLLECTION_AUTHOR,
        variables: { id: author.externalId },
      });

      // ...without success. There is no data
      expect(result.data.getCollectionAuthor).not.to.exist;

      // And there is an access denied error
      expect(result.errors[0].message).to.equal(ACCESS_DENIED_ERROR);
      expect(result.errors[0].extensions.code).to.equal('FORBIDDEN');
    });
  });
});
