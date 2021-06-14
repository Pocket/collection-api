import { PrismaClient } from '@prisma/client';
import { getCollectionStory } from './CollectionStory';
import {
  clear as clearDb,
  createAuthorHelper,
  createCollectionHelper,
  createCollectionStoryHelper,
  sortCollectionStoryAuthors,
} from '../../test/helpers';

const db = new PrismaClient();

describe('queries: CollectionStory', () => {
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
      story = await createCollectionStoryHelper(
        db,
        collection.id,
        'https://getpocket.com',
        'a story',
        'this is a story, all about how...',
        'https://some.image',
        [{ name: 'donny', sortOrder: 0 }],
        'the verge'
      );
    });

    it('should retrieve a collection story with authors', async () => {
      const retrieved = await getCollectionStory(db, story.externalId);

      expect(retrieved.title).toEqual('a story');
      expect(retrieved.authors.length).toBeGreaterThan(0);
    });

    it('should retrieve a collection story with authors sorted correctly', async () => {
      const result = await getCollectionStory(db, story.externalId);

      // the default sort returned from prisma should match our expected
      // manual sort
      expect(result.authors).toEqual(
        sortCollectionStoryAuthors(result.authors)
      );
    });

    it('should fail to retrieve a collection story for an unknown externalID', async () => {
      const retrieved = await getCollectionStory(db, story.externalId + 'typo');

      expect(retrieved).toBeFalsy();
    });
  });
});
