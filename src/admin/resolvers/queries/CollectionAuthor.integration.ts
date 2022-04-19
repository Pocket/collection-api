import { expect } from 'chai';
import slugify from 'slugify';
import { faker } from '@faker-js/faker';
import { CollectionAuthor } from '@prisma/client';
import config from '../../../config';
import { db } from '../../../test/admin-server';
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
import { COLLECTION_CURATOR_FULL } from '../../../shared/constants';

describe('queries: CollectionAuthor', () => {
  const headers = {
    name: 'Test User',
    username: 'test.user@test.com',
    // default to full access - later tests override this to test other levels of access
    groups: `group1,group2,${COLLECTION_CURATOR_FULL}`,
  };

  const server = getServerWithMockedHeaders(headers);

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

    it('should get authors in alphabetical order', async () => {
      const {
        data: { getCollectionAuthors: data },
      } = await server.executeOperation({
        query: GET_COLLECTION_AUTHORS,
        variables: {
          page: 1,
          perPage: 10,
        },
      });

      expect(data.authors[0].name).to.equal('Agatha Christie');
      expect(data.authors[1].name).to.equal('Alexander Pushkin');
      expect(data.authors[2].name).to.equal('Carl Sagan');
      expect(data.authors[3].name).to.equal('J. R. R. Tolkien');
      expect(data.authors[4].name).to.equal('René Goscinny');
      expect(data.authors[5].name).to.equal('William Shakespeare');
    });

    it('should get all available properties of collection authors', async () => {
      const {
        data: { getCollectionAuthors: data },
      } = await server.executeOperation({
        query: GET_COLLECTION_AUTHORS,
        variables: {
          page: 1,
          perPage: 1,
        },
      });

      expect(data.authors[0].externalId).to.exist;
      expect(data.authors[0].name).to.exist;
      expect(data.authors[0].slug).to.exist;
      expect(data.authors[0].bio).to.exist;
      expect(data.authors[0].imageUrl).to.exist;
      expect(data.authors[0].active).to.exist;
    });

    it('should respect pagination', async () => {
      const {
        data: { getCollectionAuthors: data },
      } = await server.executeOperation({
        query: GET_COLLECTION_AUTHORS,
        variables: {
          page: 2,
          perPage: 2,
        },
      });

      // We expect to get two results back
      expect(data.authors.length).to.equal(2);

      // Starting from page 2 of results, that is, from Carl Sagan
      expect(data.authors[0].name).to.equal('Carl Sagan');
      expect(data.authors[1].name).to.equal('J. R. R. Tolkien');
    });

    it('should return a pagination object', async () => {
      const {
        data: { getCollectionAuthors: data },
      } = await server.executeOperation({
        query: GET_COLLECTION_AUTHORS,
        variables: {
          page: 2,
          perPage: 3,
        },
      });

      expect(data.pagination.currentPage).to.equal(2);
      expect(data.pagination.totalPages).to.equal(2);
      expect(data.pagination.totalResults).to.equal(6);
      expect(data.pagination.perPage).to.equal(3);
    });

    it('should return data if no variables are supplied', async () => {
      const {
        data: { getCollectionAuthors: data },
      } = await server.executeOperation({
        query: GET_COLLECTION_AUTHORS,
      });

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
      const {
        data: { getCollectionAuthor: data },
      } = await server.executeOperation({
        query: GET_COLLECTION_AUTHOR,
        variables: { id: author.externalId },
      });

      expect(data.externalId).to.exist;
      expect(data.name).to.exist;
      expect(data.slug).to.exist;
      expect(data.bio).to.exist;
      expect(data.imageUrl).to.exist;
      expect(data.active).to.exist;
    });

    it('should fail on an invalid author id', async () => {
      const {
        data: { getCollectionAuthor: data },
      } = await server.executeOperation({
        query: GET_COLLECTION_AUTHOR,
        variables: { id: 'invalid-id' },
      });

      expect(data).not.to.exist;
    });
  });
});
