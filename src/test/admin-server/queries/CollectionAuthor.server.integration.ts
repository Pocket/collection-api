import { gql } from 'apollo-server-express';
import slugify from 'slugify';
import * as faker from 'faker';
import { CollectionAuthor } from '@prisma/client';
import config from '../../../config';
import { db, server } from '../';
import { clear as clearDb, createAuthorHelper } from '../../helpers';
import { CreateCollectionAuthorInput } from '../../../database/types';

describe('getCollectionAuthors query', () => {
  const GET_COLLECTION_AUTHORS = gql`
    query getAuthors($page: Int, $perPage: Int) {
      getCollectionAuthors(page: $page, perPage: $perPage) {
        authors {
          externalId
          name
          slug
          bio
          imageUrl
          active
        }
        pagination {
          currentPage
          totalPages
          totalResults
          perPage
        }
      }
    }
  `;

  beforeAll(async () => {
    await clearDb(db);

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

  afterAll(async () => {
    await db.$disconnect();
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

    expect(data.authors[0].name).toEqual('Agatha Christie');
    expect(data.authors[1].name).toEqual('Alexander Pushkin');
    expect(data.authors[2].name).toEqual('Carl Sagan');
    expect(data.authors[3].name).toEqual('J. R. R. Tolkien');
    expect(data.authors[4].name).toEqual('René Goscinny');
    expect(data.authors[5].name).toEqual('William Shakespeare');
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

    expect(data.authors[0].externalId).toBeTruthy();
    expect(data.authors[0].name).toBeTruthy();
    expect(data.authors[0].slug).toBeTruthy();
    expect(data.authors[0].bio).toBeTruthy();
    expect(data.authors[0].imageUrl).toBeTruthy();
    expect(data.authors[0].active).toBeTruthy();
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
    expect(data.authors.length).toEqual(2);

    // Starting from page 2 of results, that is, from Carl Sagan
    expect(data.authors[0].name).toEqual('Carl Sagan');
    expect(data.authors[1].name).toEqual('J. R. R. Tolkien');
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

    expect(data.pagination.currentPage).toEqual(2);
    expect(data.pagination.totalPages).toEqual(2);
    expect(data.pagination.totalResults).toEqual(6);
    expect(data.pagination.perPage).toEqual(3);
  });

  it('should return data if no variables are supplied', async () => {
    const {
      data: { getCollectionAuthors: data },
    } = await server.executeOperation({
      query: GET_COLLECTION_AUTHORS,
    });

    // Expect to get all our authors back
    expect(data.authors.length).toEqual(6);

    // Expect to see the app defaults for 'page' and 'perPage' variables
    expect(data.pagination.currentPage).toEqual(1);
    expect(data.pagination.perPage).toEqual(
      config.app.pagination.authorsPerPage
    );
  });
});

describe('getCollectionAuthor query', () => {
  let author: CollectionAuthor;

  const GET_COLLECTION_AUTHOR = gql`
    query getAuthor($id: String!) {
      getCollectionAuthor(externalId: $id) {
        externalId
        name
        slug
        bio
        imageUrl
        active
      }
    }
  `;

  beforeAll(async () => {
    await clearDb(db);

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

  afterAll(async () => {
    await db.$disconnect();
  });

  it('should find an author record by externalId and return all its properties', async () => {
    const {
      data: { getCollectionAuthor: data },
    } = await server.executeOperation({
      query: GET_COLLECTION_AUTHOR,
      variables: { id: author.externalId },
    });

    expect(data.externalId).toBeTruthy();
    expect(data.name).toBeTruthy();
    expect(data.slug).toBeTruthy();
    expect(data.bio).toBeTruthy();
    expect(data.imageUrl).toBeTruthy();
    expect(data.active).toBeTruthy();
  });

  it('should fail on an invalid author id', async () => {
    const {
      data: { getCollectionAuthor: data },
    } = await server.executeOperation({
      query: GET_COLLECTION_AUTHOR,
      variables: { id: 'invalid-id' },
    });

    expect(data).toBeNull();
  });
});
