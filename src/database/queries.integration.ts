import { PrismaClient, CollectionStatus } from '@prisma/client';
import {
  countAuthors,
  countPublishedCollections,
  getAuthor,
  getAuthors,
  getCollection,
  getCollectionBySlug,
  getCollectionsBySlugs,
  getCollectionStory,
  getPublishedCollections,
  searchCollections,
} from './queries';
import {
  clear as clearDb,
  createAuthorHelper,
  createCollectionHelper,
  createCollectionStoryHelper,
} from '../test/helpers';

const db = new PrismaClient();

describe('queries', () => {
  beforeEach(async () => {
    await clearDb(db);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe('collection author queries', () => {
    describe('getAuthor', () => {
      it('should get an author by their externalId', async () => {
        const author = await createAuthorHelper(db, 'the dude');

        const found = await getAuthor(db, author.externalId);

        expect(found).not.toBeNull();
      });

      it('should fail on an invalid externalId', async () => {
        const author = await createAuthorHelper(db, 'the dude');

        const found = await getAuthor(db, author.externalId + 'typo');

        expect(found).toBeNull();
      });
    });

    describe('getAuthors', () => {
      it('should get authors and respect paging', async () => {
        // create some authors to retrieve
        await createAuthorHelper(db, 'the dude');
        await createAuthorHelper(db, 'walter');
        await createAuthorHelper(db, 'donny');
        await createAuthorHelper(db, 'maude');
        await createAuthorHelper(db, 'brandt');

        // get page 2, with 2 per page
        const results = await getAuthors(db, 2, 2);

        // as we order by name ascending, this should give us maude & the dude
        expect(results.length).toEqual(2);
        expect(results[0].name).toEqual('maude');
        expect(results[1].name).toEqual('the dude');
      });
    });

    describe('countAuthors', () => {
      it('should accurately count collection authors in the system', async () => {
        // create some authors
        await createAuthorHelper(db, 'the dude');
        await createAuthorHelper(db, 'walter');
        await createAuthorHelper(db, 'donny');
        await createAuthorHelper(db, 'maude');
        await createAuthorHelper(db, 'brandt');

        const result = await countAuthors(db);

        expect(result).toEqual(5);
      });
    });
  });

  describe('collection queries', () => {
    let author;

    beforeEach(async () => {
      author = await createAuthorHelper(db, 'walter');
    });

    describe('getCollection', () => {
      it('can get a collection with no stories by external id', async () => {
        const created = await createCollectionHelper(
          db,
          'test me',
          author,
          CollectionStatus.DRAFT,
          null,
          null,
          false // don't create any stories
        );

        const collection = await getCollection(db, created.externalId);

        expect(collection.title).toEqual('test me');

        // we should return an author
        expect(collection.authors).toBeTruthy();

        // we should return an array (truthy)
        expect(collection.stories).toBeTruthy();

        // the array should be empty (bc we skipped creating stories above)
        expect(collection.stories.length).toEqual(0);
      });

      it('can get a collection with stories by external id', async () => {
        const created = await createCollectionHelper(
          db,
          'test me',
          author,
          CollectionStatus.DRAFT,
          null,
          null
        );

        const collection = await getCollection(db, created.externalId);

        // stories should have authors
        expect(collection.stories[0].authors.length).toBeGreaterThan(0);
        expect(collection.stories[0].authors[0]).toBeTruthy();
      });
    });

    describe('getCollectionBySlug', () => {
      it('can get a collection by slug', async () => {
        await createCollectionHelper(
          db,
          'test me',
          author,
          CollectionStatus.PUBLISHED
        );

        const collection = await getCollectionBySlug(db, 'test-me');

        expect(collection.title).toEqual('test me');

        // ensure we are getting extra client data
        expect(collection.authors).toBeTruthy();
        expect(collection.stories).toBeTruthy();
        expect(collection.stories[0].authors).toBeTruthy();
      });

      it("should not get a collection that isn't published", async () => {
        await createCollectionHelper(
          db,
          'test me',
          author,
          CollectionStatus.DRAFT
        );

        const collection = await getCollectionBySlug(db, 'test-me');

        expect(collection).toBeNull();
      });
    });

    describe('getCollectionsBySlugs', () => {
      it('can get collections by slugs', async () => {
        await createCollectionHelper(
          db,
          'test me',
          author,
          CollectionStatus.PUBLISHED
        );
        await createCollectionHelper(
          db,
          'test me 2',
          author,
          CollectionStatus.PUBLISHED
        );

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
      });

      it('gets only published collections', async () => {
        await createCollectionHelper(
          db,
          'published 1',
          author,
          CollectionStatus.PUBLISHED
        );
        await createCollectionHelper(
          db,
          'published 2',
          author,
          CollectionStatus.PUBLISHED
        );
        await createCollectionHelper(
          db,
          'i am le draft',
          author,
          CollectionStatus.DRAFT
        );
        await createCollectionHelper(
          db,
          'look at me i am archived',
          author,
          CollectionStatus.ARCHIVED
        );

        const collections = await getCollectionsBySlugs(db, [
          'published-1',
          'i-am-le-draft',
        ]);

        expect(collections.length).toEqual(1);
        expect(collections[0].title).toEqual('published 1');
      });
    });

    describe('getPublishedCollections', () => {
      it('gets only published collections', async () => {
        await createCollectionHelper(
          db,
          'first',
          author,
          CollectionStatus.PUBLISHED
        );
        await createCollectionHelper(
          db,
          'second',
          author,
          CollectionStatus.DRAFT
        );
        await createCollectionHelper(
          db,
          'third',
          author,
          CollectionStatus.ARCHIVED
        );
        await createCollectionHelper(
          db,
          'fourth',
          author,
          CollectionStatus.PUBLISHED
        );

        const collections = await getPublishedCollections(db, 1, 10);

        expect(collections.length).toEqual(2);
        expect(collections[0].title).toEqual('first');
        expect(collections[1].title).toEqual('fourth');
        expect(collections[0].stories).toBeTruthy();
        expect(collections[0].authors).toBeTruthy();
        expect(collections[0].stories[0].authors).toBeTruthy();
      });

      it('respects pagination', async () => {
        // `getPublishedCollections` sorts by `publishedAt` decsending, so
        // these should be returned bottom to top
        await createCollectionHelper(
          db,
          '1',
          author,
          CollectionStatus.PUBLISHED,
          new Date(2021, 0, 1)
        );
        await createCollectionHelper(
          db,
          '2',
          author,
          CollectionStatus.PUBLISHED,
          new Date(2021, 0, 2)
        );
        await createCollectionHelper(
          db,
          '3',
          author,
          CollectionStatus.PUBLISHED,
          new Date(2021, 0, 3)
        );
        await createCollectionHelper(
          db,
          '4',
          author,
          CollectionStatus.PUBLISHED,
          new Date(2021, 0, 4)
        );
        await createCollectionHelper(
          db,
          '5',
          author,
          CollectionStatus.PUBLISHED,
          new Date(2021, 0, 5)
        );

        // we are getting two collections per page, and are requesting page 2
        // page 1 should be 5 and 4. page 2 should be 3 and 2, page 3 should be 1
        const collections = await getPublishedCollections(db, 2, 2);

        expect(collections.length).toEqual(2);
        expect(collections[0].title).toEqual('3');
        expect(collections[1].title).toEqual('2');
      });
    });

    describe('countPublishedCollections', () => {
      it('should retrieve the correct count of published collections', async () => {
        await createCollectionHelper(db, '1', author, CollectionStatus.DRAFT);
        await createCollectionHelper(
          db,
          '2',
          author,
          CollectionStatus.ARCHIVED
        );
        await createCollectionHelper(
          db,
          '3',
          author,
          CollectionStatus.PUBLISHED
        );
        await createCollectionHelper(
          db,
          '4',
          author,
          CollectionStatus.PUBLISHED
        );
        await createCollectionHelper(
          db,
          '5',
          author,
          CollectionStatus.PUBLISHED
        );

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
        await createCollectionHelper(
          db,
          'the dude abides',
          author2,
          CollectionStatus.DRAFT,
          null,
          null,
          false
        );
        await createCollectionHelper(
          db,
          'does the dude abide?',
          author,
          CollectionStatus.ARCHIVED,
          null,
          null,
          false
        );
        await createCollectionHelper(
          db,
          'your opinion man',
          author2,
          CollectionStatus.PUBLISHED
        );
        await createCollectionHelper(
          db,
          'finishing my coffee',
          author,
          CollectionStatus.PUBLISHED
        );
        await createCollectionHelper(
          db,
          'the dude abides man',
          author,
          CollectionStatus.PUBLISHED
        );
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
    });
  });

  describe('collection story queries', () => {
    describe('getCollectionStory', () => {
      let story;

      beforeEach(async () => {
        const author = await createAuthorHelper(db, 'donny');
        const collection = await createCollectionHelper(db, 'test me', author);
        story = await createCollectionStoryHelper(
          db,
          collection.id,
          'https://getpocket.com',
          'a story',
          'this is a story, all about how...',
          'https://some.image',
          [{ name: 'donny' }],
          'the verge'
        );
      });

      it('should retrieve a collection story with authors', async () => {
        const retrieved = await getCollectionStory(db, story.externalId);

        expect(retrieved.title).toEqual('a story');
        expect(retrieved.authors.length).toBeGreaterThan(0);
      });

      it('should fail to retrieve a collection story for an unknown externalID', async () => {
        const retrieved = await getCollectionStory(
          db,
          story.externalId + 'typo'
        );

        expect(retrieved).toBeFalsy();
      });
    });
  });
});
