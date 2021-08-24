import { gql } from 'apollo-server-express';
import { server } from '../../../admin/server';
import { PrismaClient } from '@prisma/client';
import { clear as clearDb, createAuthorHelper } from '../../helpers';

const db = new PrismaClient();

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
        }
      }
    }
  `;

  beforeAll(async () => {
    await clearDb(db);
    // Create some authors
    await createAuthorHelper(db, 'William Shakespeare');
    await createAuthorHelper(db, 'Agatha Christie');
    await createAuthorHelper(db, 'Alexander Pushkin');
    await createAuthorHelper(db, 'René Goscinny');
    await createAuthorHelper(db, 'J. R. R. Tolkien');
  });

  it('should get authors in alphabetical order', async () => {
    const result = await server.executeOperation({
      query: GET_COLLECTION_AUTHORS,
      variables: {
        page: 1,
        perPage: 10,
      },
    });

    expect(result.data.getCollectionAuthors.authors[0].name).toEqual(
      'Agatha Christie'
    );
    expect(result.data.getCollectionAuthors.authors[1].name).toEqual(
      'Alexander Pushkin'
    );
    expect(result.data.getCollectionAuthors.authors[2].name).toEqual(
      'J. R. R. Tolkien'
    );
    expect(result.data.getCollectionAuthors.authors[3].name).toEqual(
      'René Goscinny'
    );
    expect(result.data.getCollectionAuthors.authors[4].name).toEqual(
      'William Shakespeare'
    );
  });

  it('should get all requested properties of collection authors', () => {
    //
  });

  it('should respect pagination', () => {
    //
  });

  it('should return a pagination object', () => {
    //
  });

  afterAll(async () => {
    await db.$disconnect();
  });
});
