import { PrismaClient, CollectionStatus } from '@prisma/client';
import {
  countPublishedCollections,
  getCollection,
  getCollectionBySlug,
  getCollectionsBySlugs,
  getPublishedCollections,
  searchCollections,
} from './Collection';
import {
  clear as clearDb,
  createAuthorHelper,
  createCollectionHelper,
  createCurationCategoryHelper,
  createIABCategoryHelper,
  sortCollectionStoryAuthors,
} from '../../test/helpers';

const db = new PrismaClient();

describe('queries: Collection', () => {
  let author;
  let curationCategory;
  let IABParentCategory;
  let IABChildCategory;

  beforeEach(async () => {
    await clearDb(db);
    author = await createAuthorHelper(db, 'walter');
    curationCategory = await createCurationCategoryHelper(db, 'Business');
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

  describe('getCollection', () => {
    it('can get a collection with no stories by external id', async () => {
      const created = await createCollectionHelper(db, {
        title: 'test me',
        author,
        addStories: false,
        curationCategory,
        IABParentCategory,
        IABChildCategory,
      });

      const collection = await getCollection(db, created.externalId);

      expect(collection.title).toEqual('test me');

      // we should return an author
      expect(collection.authors).toBeTruthy();

      // we should return a curation category
      expect(collection.curationCategory).toBeTruthy();
      expect(collection.curationCategory.name).toEqual(curationCategory.name);
      expect(collection.curationCategory.slug).toEqual(curationCategory.slug);
      expect(collection.IABParentCategory.name).toEqual(IABParentCategory.name);
      expect(collection.IABChildCategory.name).toEqual(IABChildCategory.name);

      // we should return an array (truthy)
      expect(collection.stories).toBeTruthy();

      // the array should be empty (bc we skipped creating stories above)
      expect(collection.stories.length).toEqual(0);
    });

    it('can get a collection with stories with authors by external id', async () => {
      const created = await createCollectionHelper(db, {
        title: 'test me',
        author,
      });

      const collection = await getCollection(db, created.externalId);

      // stories should have authors
      expect(collection.stories[0].authors.length).toBeGreaterThan(0);
      expect(collection.stories[0].authors[0]).toBeTruthy();
    });

    it('can get a collection with story authors sorted correctly', async () => {
      const created = await createCollectionHelper(db, {
        title: 'test me',
        author,
      });

      const collection = await getCollection(db, created.externalId);

      // the default sort returned from prisma should match our expected
      // manual sort
      expect(collection.stories[0].authors).toEqual(
        sortCollectionStoryAuthors(collection.stories[0].authors)
      );
    });
  });

  describe('getCollectionBySlug', () => {
    it('can get a collection by slug', async () => {
      await createCollectionHelper(db, {
        title: 'test me',
        author,
        status: CollectionStatus.PUBLISHED,
        curationCategory,
        IABParentCategory,
        IABChildCategory,
      });

      const collection = await getCollectionBySlug(db, 'test-me');

      expect(collection.title).toEqual('test me');

      // ensure we are getting extra client data
      expect(collection.authors).toBeTruthy();
      expect(collection.stories).toBeTruthy();
      expect(collection.curationCategory).toBeTruthy();
      expect(collection.stories[0].authors).toBeTruthy();
      expect(collection.IABParentCategory).toBeTruthy();
      expect(collection.IABChildCategory).toBeTruthy();
    });

    it("should not get a collection that isn't published", async () => {
      // the helper defaults to 'DRAFT' status
      await createCollectionHelper(db, {
        title: 'test me',
        author,
      });

      const collection = await getCollectionBySlug(db, 'test-me');

      expect(collection).toBeNull();
    });

    it('can get a collection by slug with story authors sorted correctly', async () => {
      await createCollectionHelper(db, {
        title: 'test me',
        author,
        status: CollectionStatus.PUBLISHED,
      });

      const collection = await getCollectionBySlug(db, 'test-me');

      // the default sort returned from prisma should match our expected
      // manual sort
      expect(collection.stories[0].authors).toEqual(
        sortCollectionStoryAuthors(collection.stories[0].authors)
      );
    });
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

  describe('getPublishedCollections', () => {
    it('gets only published collections', async () => {
      await createCollectionHelper(db, {
        title: 'first',
        author,
        status: CollectionStatus.PUBLISHED,
        IABParentCategory,
        IABChildCategory,
      });
      await createCollectionHelper(db, {
        title: 'second',
        author,
      });
      await createCollectionHelper(db, {
        title: 'third',
        author,
        status: CollectionStatus.ARCHIVED,
      });
      await createCollectionHelper(db, {
        title: 'fourth',
        author,
        status: CollectionStatus.PUBLISHED,
      });

      const collections = await getPublishedCollections(db, 1, 10);

      expect(collections.length).toEqual(2);
      expect(collections[0].title).toEqual('first');
      expect(collections[1].title).toEqual('fourth');
      expect(collections[0].stories).toBeTruthy();
      expect(collections[0].authors).toBeTruthy();
      expect(collections[0].stories[0].authors).toBeTruthy();
      expect(collections[0].IABParentCategory.name).toEqual(
        IABParentCategory.name
      );
      expect(collections[0].IABChildCategory.name).toEqual(
        IABChildCategory.name
      );
    });

    it('respects pagination', async () => {
      // `getPublishedCollections` sorts by `publishedAt` descending, so
      // these should be returned bottom to top
      await createCollectionHelper(db, {
        title: '1',
        author,
        status: CollectionStatus.PUBLISHED,
        publishedAt: new Date(2021, 0, 1),
      });
      await createCollectionHelper(db, {
        title: '2',
        author,
        status: CollectionStatus.PUBLISHED,
        publishedAt: new Date(2021, 0, 2),
      });
      await createCollectionHelper(db, {
        title: '3',
        author,
        status: CollectionStatus.PUBLISHED,
        publishedAt: new Date(2021, 0, 3),
      });
      await createCollectionHelper(db, {
        title: '4',
        author,
        status: CollectionStatus.PUBLISHED,
        publishedAt: new Date(2021, 0, 4),
      });
      await createCollectionHelper(db, {
        title: '5',
        author,
        status: CollectionStatus.PUBLISHED,
        publishedAt: new Date(2021, 0, 5),
      });

      // we are getting two collections per page, and are requesting page 2
      // page 1 should be 5 and 4. page 2 should be 3 and 2, page 3 should be 1
      const collections = await getPublishedCollections(db, 2, 2);

      expect(collections.length).toEqual(2);
      expect(collections[0].title).toEqual('3');
      expect(collections[1].title).toEqual('2');
    });

    it('can get published collections with story authors sorted correctly', async () => {
      await createCollectionHelper(db, {
        title: 'first',
        author,
        status: CollectionStatus.PUBLISHED,
      });
      await createCollectionHelper(db, {
        title: 'fourth',
        author,
        status: CollectionStatus.PUBLISHED,
      });

      const collections = await getPublishedCollections(db, 1, 10);

      // the default sort returned from prisma should match our expected
      // manual sort
      expect(collections[0].stories[0].authors).toEqual(
        sortCollectionStoryAuthors(collections[0].stories[0].authors)
      );
    });
  });

  describe('countPublishedCollections', () => {
    it('should retrieve the correct count of published collections', async () => {
      await createCollectionHelper(db, {
        title: '1',
        author,
      });
      await createCollectionHelper(db, {
        title: '2',
        author,
        status: CollectionStatus.ARCHIVED,
      });
      await createCollectionHelper(db, {
        title: '3',
        author,
        status: CollectionStatus.PUBLISHED,
      });
      await createCollectionHelper(db, {
        title: '4',
        author,
        status: CollectionStatus.PUBLISHED,
      });
      await createCollectionHelper(db, {
        title: '5',
        author,
        status: CollectionStatus.PUBLISHED,
      });

      const count = await countPublishedCollections(db);

      expect(count).toEqual(3);
    });
  });

  describe('searchCollections', () => {
    let author2;

    beforeEach(async () => {
      // create a second author for variety
      author2 = await createAuthorHelper(db, 'the dude');

      // create a batch of collections to search
      await createCollectionHelper(db, {
        title: 'the dude abides',
        author: author2,
        addStories: false,
      });
      await createCollectionHelper(db, {
        title: 'does the dude abide?',
        author,
        status: CollectionStatus.ARCHIVED,
        addStories: false,
      });
      await createCollectionHelper(db, {
        title: 'your opinion man',
        author: author2,
        status: CollectionStatus.PUBLISHED,
      });
      await createCollectionHelper(db, {
        title: 'finishing my coffee',
        author,
        status: CollectionStatus.PUBLISHED,
      });
      await createCollectionHelper(db, {
        title: 'the dude abides man',
        author,
        status: CollectionStatus.PUBLISHED,
      });
    });

    it('should search by status', async () => {
      const results = await searchCollections(db, {
        status: CollectionStatus.ARCHIVED,
      });

      expect(results.length).toEqual(1);
      expect(results[0].title).toEqual('does the dude abide?');
      expect(results[0].stories.length).toEqual(0);
    });

    it('should search by author', async () => {
      const results = await searchCollections(db, {
        author: 'the dude',
      });

      expect(results.length).toEqual(2);

      // sort order is by updatedAt descending
      expect(results[0].title).toEqual('your opinion man');
      expect(results[1].title).toEqual('the dude abides');
    });

    it('should search by title', async () => {
      const results = await searchCollections(db, {
        title: 'dude',
      });

      expect(results.length).toEqual(3);

      // sort order is by updatedAt descending
      expect(results[0].title).toEqual('the dude abides man');
      expect(results[1].title).toEqual('does the dude abide?');
      expect(results[2].title).toEqual('the dude abides');
    });

    it('should search by multiple filters', async () => {
      const results = await searchCollections(db, {
        status: CollectionStatus.PUBLISHED,
        author: author.name,
        title: 'coffee',
      });

      expect(results.length).toEqual(1);
      expect(results[0].title).toEqual('finishing my coffee');
    });

    it('should return all associated data - authors, stories, and story authors', async () => {
      const results = await searchCollections(db, {
        status: CollectionStatus.PUBLISHED,
      });

      for (let i = 0; i < results.length; i++) {
        expect(results[i].authors.length).toBeGreaterThan(0);
        expect(results[i].stories.length).toBeGreaterThan(0);

        for (let j = 0; j < results[i].stories.length; j++) {
          expect(results[i].stories[j].authors.length).toBeGreaterThan(0);
        }
      }
    });

    it('should respect pagination', async () => {
      // get 1 per page, get page 2 of the results
      // this should result in 3 matches
      const results = await searchCollections(
        db,
        {
          status: CollectionStatus.PUBLISHED,
        },
        2,
        1
      );

      // ensure our perPage is respected
      expect(results.length).toEqual(1);

      // ensure we are getting the second result (page 2)
      expect(results[0].title).toEqual('finishing my coffee');
    });

    it('can get published collections with story authors sorted correctly', async () => {
      const collections = await searchCollections(db, {
        status: CollectionStatus.PUBLISHED,
      });

      // the default sort returned from prisma should match our expected
      // manual sort
      expect(collections[0].stories[0].authors).toEqual(
        sortCollectionStoryAuthors(collections[0].stories[0].authors)
      );
    });
  });
});
