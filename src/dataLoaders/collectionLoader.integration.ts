import { PrismaClient, CollectionStatus } from '@prisma/client';
import { getCollectionsBySlugs } from '../database/queries/Collection';
import {
  clear as clearDb,
  createAuthorHelper,
  createCollectionHelper,
  createIABCategoryHelper,
  sortCollectionStoryAuthors,
} from '../test/helpers';

const db = new PrismaClient();

describe('queries: Collection', () => {
  let author;
  let IABParentCategory;
  let IABChildCategory;

  beforeEach(async () => {
    await clearDb(db);
    author = await createAuthorHelper(db, 'walter');
    IABParentCategory = await createIABCategoryHelper(db, 'Entertainment');
    IABChildCategory = await createIABCategoryHelper(
      db,
      'Bowling',
      IABParentCategory
    );
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe('getCollectionsBySlugs', () => {
    it('can get collections by slugs', async () => {
      await createCollectionHelper(db, {
        title: 'test me',
        author,
        status: CollectionStatus.PUBLISHED,
      });
      await createCollectionHelper(db, {
        title: 'test me 2',
        author,
        status: CollectionStatus.PUBLISHED,
        IABParentCategory,
        IABChildCategory,
      });

      const collections = await getCollectionsBySlugs(db, [
        'test-me',
        'test-me-2',
      ]);

      expect(collections[0].title).toEqual('test me');
      expect(collections[1].title).toEqual('test me 2');
      expect(collections[0].authors).toBeTruthy();
      expect(collections[1].authors).toBeTruthy();
      expect(collections[0].stories).toBeTruthy();
      expect(collections[0].stories[0].authors.length).toBeGreaterThan(0);
      expect(collections[0].stories[0].authors[0]).toBeTruthy();
      expect(collections[1].stories).toBeTruthy();
      expect(collections[0].stories[1].authors.length).toBeGreaterThan(0);
      expect(collections[1].IABParentCategory.name).toEqual(
        IABParentCategory.name
      );
      expect(collections[1].IABChildCategory.name).toEqual(
        IABChildCategory.name
      );
    });

    it('gets only published collections', async () => {
      await createCollectionHelper(db, {
        title: 'published 1',
        author,
        status: CollectionStatus.PUBLISHED,
      });
      await createCollectionHelper(db, {
        title: 'published 2',
        author,
        status: CollectionStatus.PUBLISHED,
      });
      await createCollectionHelper(db, {
        title: 'i am le draft',
        author,
      });
      await createCollectionHelper(db, {
        title: 'look at me i am archived',
        author,
        status: CollectionStatus.ARCHIVED,
      });

      const collections = await getCollectionsBySlugs(db, [
        'published-1',
        'i-am-le-draft',
      ]);

      expect(collections.length).toEqual(1);
      expect(collections[0].title).toEqual('published 1');
    });

    it('can get collections by slugs with story authors sorted correctly', async () => {
      await createCollectionHelper(db, {
        title: 'test me',
        author,
        status: CollectionStatus.PUBLISHED,
      });
      await createCollectionHelper(db, {
        title: 'test me 2',
        author,
        status: CollectionStatus.PUBLISHED,
      });

      const collections = await getCollectionsBySlugs(db, [
        'test-me',
        'test-me-2',
      ]);

      // the default sort returned from prisma should match our expected
      // manual sort
      expect(collections[0].stories[0].authors).toEqual(
        sortCollectionStoryAuthors(collections[0].stories[0].authors)
      );
    });
  });
});
