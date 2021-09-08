import { gql } from 'apollo-server-express';
import * as faker from 'faker';
import slugify from 'slugify';
import { db, server } from '../';
import config from '../../../config';
import { clear as clearDb, createAuthorHelper } from '../../helpers';
import {
  CreateCollectionAuthorInput,
  UpdateCollectionAuthorImageUrlInput,
  UpdateCollectionAuthorInput,
} from '../../../database/types';

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
      const result = await server.executeOperation({
        query: CREATE_COLLECTION_AUTHOR,
        variables,
      });

      // ...without success. There is no data
      expect(result.data).toBeFalsy();

      // And there is the correct error from the resolvers
      expect(result.errors[0].message).toMatch(
        `An author with the slug "${variables.slug}" already exists`
      );
    });

    it('fails when no data is supplied', async () => {
      // Attempt to create an author with no input data...
      const result = await server.executeOperation({
        query: CREATE_COLLECTION_AUTHOR,
      });

      // ...without success. There is no data
      expect(result.data).toBeFalsy();

      // And the server responds with an error about the first variable in the input
      // that is missing
      expect(result.errors[0].message).toMatch(
        'Variable "$name" of required type "String!" was not provided.'
      );
    });
  });

  describe('updateCollectionAuthor mutation', () => {
    const UPDATE_COLLECTION_AUTHOR = gql`
      mutation updateCollectionAuthor(
        $externalId: String!
        $name: String!
        $slug: String!
        $bio: Markdown
        $imageUrl: Url
        $active: Boolean
      ) {
        updateCollectionAuthor(
          data: {
            externalId: $externalId
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

    it('updates an author', async () => {
      const author = await createAuthorHelper(db, 'Ian Fleming');

      const input: UpdateCollectionAuthorInput = {
        externalId: author.externalId,
        name: 'Agatha Christie',
        slug: 'agatha-christie',
        bio: faker.lorem.paragraphs(2),
        imageUrl: faker.image.imageUrl(),
        active: false,
      };

      const {
        data: { updateCollectionAuthor: updatedAuthor },
      } = await server.executeOperation({
        query: UPDATE_COLLECTION_AUTHOR,
        variables: input,
      });

      expect(updatedAuthor.name).toEqual(input.name);
      expect(updatedAuthor.slug).toEqual(input.slug);
      expect(updatedAuthor.bio).toEqual(input.bio);
      expect(updatedAuthor.imageUrl).toEqual(input.imageUrl);
      expect(updatedAuthor.active).toEqual(input.active);
    });

    it('does not update optional variables if they are not supplied', async () => {
      const author = await createAuthorHelper(db, 'Ian Fleming');

      const input: UpdateCollectionAuthorInput = {
        externalId: author.externalId,
        name: 'Mark Twain',
        slug: 'mark-twain',
      };

      const {
        data: { updateCollectionAuthor: updatedAuthor },
      } = await server.executeOperation({
        query: UPDATE_COLLECTION_AUTHOR,
        variables: input,
      });

      // Expect the values supplied to be updated
      expect(updatedAuthor.name).toEqual(input.name);
      expect(updatedAuthor.slug).toEqual(input.slug);

      // And the rest to stay as is
      expect(updatedAuthor.bio).toEqual(author.bio);
      expect(updatedAuthor.imageUrl).toEqual(author.imageUrl);
      expect(updatedAuthor.active).toEqual(author.active);
    });

    it('should fail to update author with a duplicate slug', async () => {
      // create one author
      const author = await createAuthorHelper(db, 'Ian Fleming');
      // create another - this one's slug will be 'mark-twain'
      await createAuthorHelper(db, 'Mark Twain');

      const input: UpdateCollectionAuthorInput = {
        externalId: author.externalId,
        name: 'Any Other Name',
        slug: 'mark-twain',
      };

      // Attempt to use the same slug one more time...
      const result = await server.executeOperation({
        query: UPDATE_COLLECTION_AUTHOR,
        variables: input,
      });

      // ...without success. There is no data
      expect(result.data).toBeFalsy();

      // And there is the correct error from the resolvers
      expect(result.errors[0].message).toMatch(
        `An author with the slug "${input.slug}" already exists`
      );
    });
  });

  describe('updateCollectionAuthorImageUrl', () => {
    const UPDATE_COLLECTION_AUTHOR_IMAGE_URL = gql`
      mutation updateCollectionAuthorImageUrl(
        $externalId: String!
        $imageUrl: Url!
      ) {
        updateCollectionAuthorImageUrl(
          data: { externalId: $externalId, imageUrl: $imageUrl }
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

    it("updates an author's imageUrl and doesn't touch the other props", async () => {
      const author = await createAuthorHelper(db, 'Ian Fleming');
      const newImageUrl = 'https://www.example.com/ian-fleming.jpg';

      const input: UpdateCollectionAuthorImageUrlInput = {
        externalId: author.externalId,
        imageUrl: newImageUrl,
      };

      const {
        data: { updateCollectionAuthorImageUrl: updatedAuthor },
      } = await server.executeOperation({
        query: UPDATE_COLLECTION_AUTHOR_IMAGE_URL,
        variables: input,
      });

      // The image URL should be updated
      expect(updatedAuthor.imageUrl).toEqual(input.imageUrl);

      // But the rest of the values should stay the same
      expect(updatedAuthor.name).toEqual(author.name);
      expect(updatedAuthor.slug).toEqual(author.slug);
      expect(updatedAuthor.bio).toEqual(author.bio);
      expect(updatedAuthor.active).toEqual(author.active);
    });
  });
});
