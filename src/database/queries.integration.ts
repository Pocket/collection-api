import { PrismaClient, CollectionStatus } from '@prisma/client';
import {
  countPublishedCollections,
  getCollection,
  getCollectionBySlug,
  getCollectionsBySlugs,
  getPublishedCollections,
  searchCollections,
} from './queries';
import {
  clear as clearDb,
  createAuthorHelper,
  createCollectionHelper,
} from '../test/helpers';

const db = new PrismaClient();

describe('queries', () => {
  let author;

  beforeEach(async () => {
    await clearDb(db);
    author = await createAuthorHelper(db, 'walter');
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe('collection queries', () => {
    describe('getCollection', () => {
      it('can get a collection by external id', async () => {
        const created = await createCollectionHelper(db, 'test me', author);

        const collection = await getCollection(db, created.externalId);

        expect(collection.title).toEqual('test me');

        // ensure we aren't getting extra client data
        expect(collection.authors).toBeFalsy();
        expect(collection.stories).toBeFalsy();
      });
    });

    describe('getCollectionBySlug', () => {
      it('can get a collection by slug', async () => {
        await createCollectionHelper(
          db,
          'test me',
          author,
          CollectionStatus.published
        );

        const collection = await getCollectionBySlug(db, 'test-me');

        expect(collection.title).toEqual('test me');

        // ensure we are getting extra client data
        expect(collection.authors).not.toBeNull();
        expect(collection.stories).not.toBeNull();
      });

      it("should not get a collection that isn't published", async () => {
        await createCollectionHelper(
          db,
          'test me',
          author,
          CollectionStatus.draft
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
          CollectionStatus.published
        );
        await createCollectionHelper(
          db,
          'test me 2',
          author,
          CollectionStatus.published
        );

        const collections = await getCollectionsBySlugs(db, [
          'test-me',
          'test-me-2',
        ]);

        expect(collections[0].title).toEqual('test me');
        expect(collections[1].title).toEqual('test me 2');
      });

      it('gets only published collections', async () => {
        await createCollectionHelper(
          db,
          'published 1',
          author,
          CollectionStatus.published
        );
        await createCollectionHelper(
          db,
          'published 2',
          author,
          CollectionStatus.published
        );
        await createCollectionHelper(
          db,
          'i am le draft',
          author,
          CollectionStatus.draft
        );
        await createCollectionHelper(
          db,
          'look at me i am archived',
          author,
          CollectionStatus.archived
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
          CollectionStatus.published
        );
        await createCollectionHelper(
          db,
          'second',
          author,
          CollectionStatus.draft
        );
        await createCollectionHelper(
          db,
          'third',
          author,
          CollectionStatus.archived
        );
        await createCollectionHelper(
          db,
          'fourth',
          author,
          CollectionStatus.published
        );

        const collections = await getPublishedCollections(db, 1, 10);

        expect(collections.length).toEqual(2);
        expect(collections[0].title).toEqual('first');
        expect(collections[1].title).toEqual('fourth');
      });

      it('respects pagination', async () => {
        // `getPublishedCollections` sorts by `publishedAt` decsending, so
        // these should be returned bottom to top
        await createCollectionHelper(
          db,
          '1',
          author,
          CollectionStatus.published,
          new Date(2021, 0, 1)
        );
        await createCollectionHelper(
          db,
          '2',
          author,
          CollectionStatus.published,
          new Date(2021, 0, 2)
        );
        await createCollectionHelper(
          db,
          '3',
          author,
          CollectionStatus.published,
          new Date(2021, 0, 3)
        );
        await createCollectionHelper(
          db,
          '4',
          author,
          CollectionStatus.published,
          new Date(2021, 0, 4)
        );
        await createCollectionHelper(
          db,
          '5',
          author,
          CollectionStatus.published,
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
        await createCollectionHelper(db, '1', author, CollectionStatus.draft);
        await createCollectionHelper(
          db,
          '2',
          author,
          CollectionStatus.archived
        );
        await createCollectionHelper(
          db,
          '3',
          author,
          CollectionStatus.published
        );
        await createCollectionHelper(
          db,
          '4',
          author,
          CollectionStatus.published
        );
        await createCollectionHelper(
          db,
          '5',
          author,
          CollectionStatus.published
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
          CollectionStatus.draft
        );
        await createCollectionHelper(
          db,
          'does the dude abide?',
          author,
          CollectionStatus.archived
        );
        await createCollectionHelper(
          db,
          'your opinion man',
          author2,
          CollectionStatus.published
        );
        await createCollectionHelper(
          db,
          'finishing my coffee',
          author,
          CollectionStatus.published
        );
        await createCollectionHelper(
          db,
          'the dude abides man',
          author,
          CollectionStatus.published
        );
      });

      it('should search by status', async () => {
        const results = await searchCollections(db, {
          status: CollectionStatus.archived,
        });

        expect(results.length).toEqual(1);
        expect(results[0].title).toEqual('does the dude abide?');
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
          status: CollectionStatus.published,
          author: author.name,
          title: 'coffee',
        });

        expect(results.length).toEqual(1);
        expect(results[0].title).toEqual('finishing my coffee');
      });

      it('should respect pagination', async () => {
        // get 1 per page, get page 2 of the results
        // this should result in 3 matches
        const results = await searchCollections(
          db,
          {
            status: CollectionStatus.published,
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
});
