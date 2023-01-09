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
import { COLLECTION_CURATOR_FULL } from '../../../shared/constants';
import { startServer } from '../../../express';
import { IAdminContext } from '../../context';

describe('queries: CollectionAuthor', () => {
  let app: Express.Application;
  let server: ApolloServer<IAdminContext>;
  let graphQLUrl: string;
  let db: PrismaClient;

  const headers = {
    name: 'Test User',
    username: 'test.user@test.com',
    // default to full access - later tests override this to test other levels of access
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

    it('should get authors in alphabetical order', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(GET_COLLECTION_AUTHORS),
          variables: {
            page: 1,
            perPage: 10,
          },
        });
      const data = result.body.data.getCollectionAuthors;

      expect(data.authors[0].name).to.equal('Agatha Christie');
      expect(data.authors[1].name).to.equal('Alexander Pushkin');
      expect(data.authors[2].name).to.equal('Carl Sagan');
      expect(data.authors[3].name).to.equal('J. R. R. Tolkien');
      expect(data.authors[4].name).to.equal('René Goscinny');
      expect(data.authors[5].name).to.equal('William Shakespeare');
    });

    it('should get all available properties of collection authors', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(GET_COLLECTION_AUTHORS),
          variables: {
            page: 1,
            perPage: 1,
          },
        });
      const data = result.body.data.getCollectionAuthors;

      expect(data.authors[0].externalId).to.exist;
      expect(data.authors[0].name).to.exist;
      expect(data.authors[0].slug).to.exist;
      expect(data.authors[0].bio).to.exist;
      expect(data.authors[0].imageUrl).to.exist;
      expect(data.authors[0].active).to.exist;
    });

    it('should respect pagination', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(GET_COLLECTION_AUTHORS),
          variables: {
            page: 2,
            perPage: 2,
          },
        });
      const data = result.body.data.getCollectionAuthors;

      // We expect to get two results back
      expect(data.authors.length).to.equal(2);

      // Starting from page 2 of results, that is, from Carl Sagan
      expect(data.authors[0].name).to.equal('Carl Sagan');
      expect(data.authors[1].name).to.equal('J. R. R. Tolkien');
    });

    it('should return a pagination object', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(GET_COLLECTION_AUTHORS),
          variables: {
            page: 2,
            perPage: 3,
          },
        });
      const data = result.body.data.getCollectionAuthors;

      expect(data.pagination.currentPage).to.equal(2);
      expect(data.pagination.totalPages).to.equal(2);
      expect(data.pagination.totalResults).to.equal(6);
      expect(data.pagination.perPage).to.equal(3);
    });

    it('should return data if no variables are supplied', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(GET_COLLECTION_AUTHORS) });
      const data = result.body.data.getCollectionAuthors;

      // Expect to get all our authors back
      expect(data.authors.length).to.equal(6);

      // Expect to see the app defaults for 'page' and 'perPage' variables
      expect(data.pagination.currentPage).to.equal(1);
      expect(data.pagination.perPage).to.equal(
        config.app.pagination.authorsPerPage
      );
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

    it('should find an author record by externalId and return all its properties', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(GET_COLLECTION_AUTHOR),
          variables: { id: author.externalId },
        });
      const data = result.body.data.getCollectionAuthor;

      expect(data.externalId).to.exist;
      expect(data.name).to.exist;
      expect(data.slug).to.exist;
      expect(data.bio).to.exist;
      expect(data.imageUrl).to.exist;
      expect(data.active).to.exist;
    });

    it('should return NOT_FOUND on an invalid author id', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(GET_COLLECTION_AUTHOR),
          variables: { id: 'invalid-id' },
        });

      expect(result.body.errors.length).to.equal(1);
      expect(result.body.errors[0].message).to.equal(
        `Error - Not Found: invalid-id`
      );
      expect(result.body.errors[0].extensions.code).to.equal('NOT_FOUND');
      expect(result.body.data.getCollectionAuthor).not.to.exist;
    });
  });
});
