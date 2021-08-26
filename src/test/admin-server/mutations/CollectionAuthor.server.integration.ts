import { gql } from 'apollo-server-express';
import * as faker from 'faker';
import slugify from 'slugify';
import { db, server } from '../../../admin/server';
import config from '../../../config';
import { clear as clearDb } from '../../helpers';
import { CreateCollectionAuthorInput } from '../../../database/types';

describe('mutations: CollectionAuthor', () => {
  const createData: CreateCollectionAuthorInput = {
    name: 'Agatha Christie',
    slug: 'agatha-christie',
    bio: faker.lorem.paragraphs(2),
    imageUrl: faker.image.imageUrl(),
    active: true,
  };

  beforeEach(async () => {
    await clearDb(db);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe('createCollectionAuthor mutation', () => {
    const CREATE_COLLECTION_AUTHOR = gql`
      mutation createCollectionAuthor(
        $name: String!
        $slug: String
        $bio: Markdown
        $imageUrl: Url
        $active: Boolean
      ) {
        createCollectionAuthor(
          data: {
            name: $name
            slug: $slug
            bio: $bio
            imageUrl: $imageUrl
            active: $active
          }
        ) {
          externalId
          name
          slug
          bio
          imageUrl
          active
        }
      }
    `;

    it('creates an author with just the name supplied', async () => {
      const name = 'Ian Fleming';

      const {
        data: { createCollectionAuthor: author },
      } = await server.executeOperation({
        query: CREATE_COLLECTION_AUTHOR,
        variables: { name },
      });

      expect(author.externalId).toBeTruthy();
      expect(author.name).toEqual(name);
      expect(author.slug).toEqual(slugify(name, config.slugify));
    });

    it('creates an author with all props supplied', async () => {
      const {
        data: { createCollectionAuthor: author },
      } = await server.executeOperation({
        query: CREATE_COLLECTION_AUTHOR,
        variables: createData,
      });

      expect(author.externalId).toBeTruthy();
      expect(author.name).toEqual(createData.name);
      expect(author.slug).toEqual(createData.slug);
      expect(author.bio).toEqual(createData.bio);
      expect(author.imageUrl).toEqual(createData.imageUrl);
      expect(author.active).toEqual(createData.active);
    });

    it('fails on attempting to create an author with a duplicate slug', async () => {
      const variables: CreateCollectionAuthorInput = {
        name: 'James Bond',
        slug: 'james-bond',
      };

      // Create one author
      await server.executeOperation({
        query: CREATE_COLLECTION_AUTHOR,
        variables,
      });

      // Attempt to use the same slug one more time...
      await expect(
        server.executeOperation({
          query: CREATE_COLLECTION_AUTHOR,
          variables,
        })
        // ...without success
      ).rejects.toThrowError();
    });

    it('fails when no data is supplied', async () => {
      // Attempt to create an author with no input data...
      await expect(
        server.executeOperation({
          query: CREATE_COLLECTION_AUTHOR,
        })
        // ...without success
      ).rejects.toThrowError();
    });
  });
});
