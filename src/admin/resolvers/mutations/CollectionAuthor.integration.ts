import { expect } from 'chai';
import {
  CreateCollectionAuthorInput,
  UpdateCollectionAuthorImageUrlInput,
  UpdateCollectionAuthorInput,
} from '../../../database/types';
import { COLLECTION_CURATOR_FULL } from '../../../shared/constants';
import { db } from '../../../test/admin-server';
import {
  clear as clearDb,
  createAuthorHelper,
  getServerWithMockedHeaders,
} from '../../../test/helpers';
import {
  CREATE_COLLECTION_AUTHOR,
  UPDATE_COLLECTION_AUTHOR,
  UPDATE_COLLECTION_AUTHOR_IMAGE_URL,
} from './sample-mutations.gql';

describe('mutations: CollectionAuthor', () => {
  const headers = {
    name: 'Test User',
    username: 'test.user@test.com',
    groups: `group1,group2,${COLLECTION_CURATOR_FULL}`,
  };

  const server = getServerWithMockedHeaders(headers);

  beforeEach(async () => {
    await clearDb(db);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe('createAuthor', () => {
    it('should create a collection author with a default slug', async () => {
      const input: CreateCollectionAuthorInput = {
        name: 'the dude',
      };

      const { data } = await server.executeOperation({
        query: CREATE_COLLECTION_AUTHOR,
        variables: { data: input },
      });

      expect(data.createCollectionAuthor.name).to.equal('the dude');
      expect(data.createCollectionAuthor.slug).to.equal('the-dude');
    });

    it('should create a collection author with all fields specified', async () => {
      const input: CreateCollectionAuthorInput = {
        name: 'the dude',
        slug: 'his-dudeness',
        bio: 'the dude abides',
        imageUrl: 'https://i.imgur.com/YeydXfW.gif',
      };

      const { data } = await server.executeOperation({
        query: CREATE_COLLECTION_AUTHOR,
        variables: { data: input },
      });

      expect(data.createCollectionAuthor.name).to.equal('the dude');
      expect(data.createCollectionAuthor.slug).to.equal('his-dudeness');
      expect(data.createCollectionAuthor.bio).to.equal('the dude abides');
      expect(data.createCollectionAuthor.imageUrl).to.equal(
        'https://i.imgur.com/YeydXfW.gif'
      );
    });

    it('should fail to create a collection author on duplicate slug', async () => {
      const input: CreateCollectionAuthorInput = {
        name: 'the dude',
        slug: 'his-dudeness',
      };

      await server.executeOperation({
        query: CREATE_COLLECTION_AUTHOR,
        variables: { data: input },
      });

      // change the name just because
      input.name = 'walter sobchak';

      // should fail trying to create an author with the same slug
      const data = await server.executeOperation({
        query: CREATE_COLLECTION_AUTHOR,
        variables: { data: input },
      });

      expect(data.errors.length).to.equal(1);
      expect(data.errors[0].message).to.equal(
        'An author with the slug "his-dudeness" already exists'
      );
    });
  });

  describe('updateAuthor', () => {
    it('should update a collection author', async () => {
      const author = await createAuthorHelper(db, 'the dude');

      const input: UpdateCollectionAuthorInput = {
        externalId: author.externalId,
        name: 'el duderino',
        slug: 'el-duderino',
        bio: 'he abides, man',
      };

      const { data } = await server.executeOperation({
        query: UPDATE_COLLECTION_AUTHOR,
        variables: { data: input },
      });

      expect(data.updateCollectionAuthor.name).to.equal(input.name);
      expect(data.updateCollectionAuthor.bio).to.equal(input.bio);
    });

    it('should update to a specified collection author slug', async () => {
      const author = await createAuthorHelper(db, 'the dude');

      const input: UpdateCollectionAuthorInput = {
        externalId: author.externalId,
        name: 'el duderino',
        slug: 'his-dudeness',
      };

      const { data } = await server.executeOperation({
        query: UPDATE_COLLECTION_AUTHOR,
        variables: { data: input },
      });

      expect(data.updateCollectionAuthor.slug).to.equal(input.slug);
    });

    it('should fail to update a collection author slug if another author has that slug', async () => {
      // will create a slug of 'the-dude'
      await createAuthorHelper(db, 'the dude');

      // will create a slug of 'walter'
      const author2 = await createAuthorHelper(db, 'walter');

      // try to make walter's slug 'the-dude'
      const input: UpdateCollectionAuthorInput = {
        externalId: author2.externalId,
        name: author2.name,
        slug: 'the-dude',
      };

      const data = await server.executeOperation({
        query: UPDATE_COLLECTION_AUTHOR,
        variables: { data: input },
      });

      // should fail trying to make walter's slug 'the dude'
      // there's only one the dude
      expect(data.errors.length).to.equal(1);
      expect(data.errors[0].message).to.equal(
        'An author with the slug "the-dude" already exists'
      );
    });
  });

  describe('updateAuthorImageUrl', () => {
    it('should update a collection author image url', async () => {
      const author = await createAuthorHelper(db, 'the dude');
      const randomKitten = 'https://placekitten.com/g/200/300';

      const input: UpdateCollectionAuthorImageUrlInput = {
        externalId: author.externalId,
        imageUrl: randomKitten,
      };

      const { data } = await server.executeOperation({
        query: UPDATE_COLLECTION_AUTHOR_IMAGE_URL,
        variables: { data: input },
      });

      expect(data.updateCollectionAuthorImageUrl.imageUrl).to.equal(
        input.imageUrl
      );
    });

    it('should not update any other author fields', async () => {
      const author = await createAuthorHelper(db, 'the dude');
      const randomKitten = 'https://placekitten.com/g/200/300';

      const input: UpdateCollectionAuthorImageUrlInput = {
        externalId: author.externalId,
        imageUrl: randomKitten,
      };

      const { data } = await server.executeOperation({
        query: UPDATE_COLLECTION_AUTHOR_IMAGE_URL,
        variables: { data: input },
      });

      expect(data.updateCollectionAuthorImageUrl.name).to.equal(author.name);
      expect(data.updateCollectionAuthorImageUrl.slug).to.equal(author.slug);
      expect(data.updateCollectionAuthorImageUrl.bio).to.equal(author.bio);
      expect(data.updateCollectionAuthorImageUrl.active).to.equal(
        author.active
      );
    });
  });
});
