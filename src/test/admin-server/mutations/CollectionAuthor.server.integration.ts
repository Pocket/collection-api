import * as faker from 'faker';
import slugify from 'slugify';
import { db, getServer } from '../';
import config from '../../../config';
import {
  clear as clearDb,
  createAuthorHelper,
  getServerWithMockedHeaders,
} from '../../helpers';
import {
  CreateCollectionAuthorInput,
  UpdateCollectionAuthorImageUrlInput,
  UpdateCollectionAuthorInput,
} from '../../../database/types';
import {
  CREATE_COLLECTION_AUTHOR,
  UPDATE_COLLECTION_AUTHOR,
  UPDATE_COLLECTION_AUTHOR_IMAGE_URL,
} from './mutations.gql';
import {
  ACCESS_DENIED_ERROR,
  COLLECTION_CURATOR_FULL,
} from '../../../shared/constants';

describe('mutations: CollectionAuthor', () => {
  const createData: CreateCollectionAuthorInput = {
    name: 'Agatha Christie',
    slug: 'agatha-christie',
    bio: faker.lorem.paragraphs(2),
    imageUrl: faker.image.imageUrl(),
    active: true,
  };

  const headers = {
    name: 'Test User',
    username: 'test.user@test.com',
    groups: `group1,group2,${COLLECTION_CURATOR_FULL}`,
  };

  const server = getServerWithMockedHeaders(headers);

  beforeAll(async () => {
    await server.start();
  });

  afterAll(async () => {
    await db.$disconnect();
    await server.stop();
  });

  beforeEach(async () => {
    await clearDb(db);
  });

  describe('createCollectionAuthor mutation', () => {
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

    it('should fail if user has no access to perform this mutation', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,no-access-for-you`,
      };

      const server = getServerWithMockedHeaders(headers);
      await server.start();

      const variables: CreateCollectionAuthorInput = {
        name: 'James Bond',
        slug: 'james-bond',
      };

      // Attempt to create an author
      const result = await server.executeOperation({
        query: CREATE_COLLECTION_AUTHOR,
        variables,
      });

      // ...without success. There is no data
      expect(result.data).toBeFalsy();

      // And there is an access denied error
      expect(result.errors[0].message).toMatch(ACCESS_DENIED_ERROR);

      await server.stop();
    });

    it('should fail if request headers are undefined', async () => {
      const server = getServer();
      await server.start();

      const variables: CreateCollectionAuthorInput = {
        name: 'James Bond',
        slug: 'james-bond',
      };

      // Attempt to create an author
      const result = await server.executeOperation({
        query: CREATE_COLLECTION_AUTHOR,
        variables,
      });

      // ...without success. There is no data
      expect(result.data).toBeFalsy();

      // And there is an access denied error
      expect(result.errors[0].message).toMatch(ACCESS_DENIED_ERROR);

      await server.stop();
    });
  });

  describe('updateCollectionAuthor mutation', () => {
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

    it('should fail if user has no access to perform this mutation', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,no-access-for-you`,
      };

      const server = getServerWithMockedHeaders(headers);
      await server.start();

      const author = await createAuthorHelper(db, 'Ian Fleming');

      const input: UpdateCollectionAuthorInput = {
        externalId: author.externalId,
        name: 'Agatha Christie',
        slug: 'agatha-christie',
        bio: faker.lorem.paragraphs(2),
        imageUrl: faker.image.imageUrl(),
        active: false,
      };

      const result = await server.executeOperation({
        query: UPDATE_COLLECTION_AUTHOR,
        variables: input,
      });

      // ...without success. There is no data
      expect(result.data).toBeFalsy();

      // And there is an access denied error
      expect(result.errors[0].message).toMatch(ACCESS_DENIED_ERROR);

      await server.stop();
    });

    it('should fail if request headers are undefined', async () => {
      const server = getServer();
      await server.start();

      const author = await createAuthorHelper(db, 'Ian Fleming');

      const input: UpdateCollectionAuthorInput = {
        externalId: author.externalId,
        name: 'Agatha Christie',
        slug: 'agatha-christie',
        bio: faker.lorem.paragraphs(2),
        imageUrl: faker.image.imageUrl(),
        active: false,
      };

      const result = await server.executeOperation({
        query: UPDATE_COLLECTION_AUTHOR,
        variables: input,
      });

      // ...without success. There is no data
      expect(result.data).toBeFalsy();

      // And there is an access denied error
      expect(result.errors[0].message).toMatch(ACCESS_DENIED_ERROR);

      await server.stop();
    });
  });

  describe('updateCollectionAuthorImageUrl', () => {
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

    it('should fail if user has no access to perform this mutation', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        groups: `group1,group2,no-access-for-you`,
      };

      const server = getServerWithMockedHeaders(headers);
      await server.start();

      const author = await createAuthorHelper(db, 'Ian Fleming');
      const newImageUrl = 'https://www.example.com/ian-fleming.jpg';

      const input: UpdateCollectionAuthorImageUrlInput = {
        externalId: author.externalId,
        imageUrl: newImageUrl,
      };

      const result = await server.executeOperation({
        query: UPDATE_COLLECTION_AUTHOR_IMAGE_URL,
        variables: input,
      });

      // ...without success. There is no data
      expect(result.data).toBeFalsy();

      // And there is an access denied error
      expect(result.errors[0].message).toMatch(ACCESS_DENIED_ERROR);

      await server.stop();
    });

    it('should fail if request headers are undefined', async () => {
      const server = getServer();
      await server.start();

      const author = await createAuthorHelper(db, 'Ian Fleming');
      const newImageUrl = 'https://www.example.com/ian-fleming.jpg';

      const input: UpdateCollectionAuthorImageUrlInput = {
        externalId: author.externalId,
        imageUrl: newImageUrl,
      };

      const result = await server.executeOperation({
        query: UPDATE_COLLECTION_AUTHOR_IMAGE_URL,
        variables: input,
      });

      // ...without success. There is no data
      expect(result.data).toBeFalsy();

      // And there is an access denied error
      expect(result.errors[0].message).toMatch(ACCESS_DENIED_ERROR);

      await server.stop();
    });
  });
});
