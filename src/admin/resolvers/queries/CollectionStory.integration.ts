import { expect } from 'chai';
import {
  clear as clearDb,
  createAuthorHelper,
  createCollectionHelper,
  createCollectionStoryHelper,
  sortCollectionStoryAuthors,
  getServerWithMockedHeaders,
} from '../../../test/helpers';
import { db } from '../../../test/admin-server';
import { COLLECTION_CURATOR_FULL } from '../../../shared/constants';
import { GET_COLLECTION_STORY } from './sample-queries.gql';

describe('queries: CollectionStory', () => {
  const headers = {
    name: 'Test User',
    username: 'test.user@test.com',
    // default to full access - auth tests occur in a separate test file
    groups: `group1,group2,${COLLECTION_CURATOR_FULL}`,
  };

  // note that calling `executeOperation` on this server does not require
  // calling `server.start()`
  const server = getServerWithMockedHeaders(headers);

  beforeEach(async () => {
    await clearDb(db);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe('getCollectionStory', () => {
    let story;

    beforeEach(async () => {
      const author = await createAuthorHelper(db, 'donny');
      const collection = await createCollectionHelper(db, {
        title: 'test me',
        author,
      });

      story = await createCollectionStoryHelper(db, {
        collectionId: collection.id,
        url: 'https://getpocket.com',
        title: 'a story',
        excerpt: 'this is a story, all about how...',
        imageUrl: 'https://some.image',
        authors: [{ name: 'donny', sortOrder: 0 }],
        publisher: 'the verge',
        fromPartner: false,
      });
    });

    it('should retrieve a collection story with authors', async () => {
      const { data } = await server.executeOperation({
        query: GET_COLLECTION_STORY,
        variables: {
          externalId: story.externalId,
        },
      });

      const retrieved = data?.getCollectionStory;

      expect(retrieved.title).to.equal('a story');
      expect(retrieved.authors.length).to.be.greaterThan(0);
    });

    it('should retrieve a collection story with image url', async () => {
      const { data } = await server.executeOperation({
        query: GET_COLLECTION_STORY,
        variables: {
          externalId: story.externalId,
        },
      });

      const retrieved = data?.getCollectionStory;

      expect(retrieved.imageUrl).to.equal(retrieved.image.url);
    });

    it('should retrieve a collection story with authors sorted correctly', async () => {
      const { data } = await server.executeOperation({
        query: GET_COLLECTION_STORY,
        variables: {
          externalId: story.externalId,
        },
      });

      const retrieved = data?.getCollectionStory;

      // the default sort returned from prisma should match our expected
      // manual sort
      expect(retrieved.authors).to.equal(
        sortCollectionStoryAuthors(retrieved.authors)
      );
    });

    it('should return NOT_FOUND for an unknown externalID', async () => {
      const result = await server.executeOperation({
        query: GET_COLLECTION_STORY,
        variables: {
          externalId: story.externalId + 'typo',
        },
      });

      expect(result.errors.length).to.equal(1);
      expect(result.errors[0].message).to.equal(
        `Error - Not Found: ${story.externalId}typo`
      );
      expect(result.errors[0].extensions.code).to.equal('NOT_FOUND');
      expect(result.data.getCollectionStory).not.to.exist;
    });
  });
});
