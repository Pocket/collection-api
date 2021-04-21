import { PrismaClient, Collection, CollectionStatus } from '@prisma/client';
import { getCollection } from './queries';
import { UpdateCollectionInput } from './mutations';
import {
  clear as clearDb,
  createAuthor,
  createCollection,
} from '../test/helpers';
import { updateCollection } from './mutations';

const db = new PrismaClient();

describe('mutations', () => {
  beforeEach(async () => {
    await clearDb(db);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe('updateCollection', () => {
    it('should update a collection', async () => {
      const author = await createAuthor(db, 'walter');
      const initial = await createCollection(db, 'first iteration', author);

      const data: UpdateCollectionInput = {
        externalId: initial.externalId,
        slug: initial.slug,
        title: 'second iteration',
        authorExternalId: author.externalId,
      };

      // should return the updated info
      const updated = await updateCollection(db, data);
      expect(updated.title).toEqual('second iteration');

      // should have updated the updatedAt field
      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        initial.updatedAt.getTime()
      );

      // verify on a re-fetch that the update was persisted
      // is this necessary?
      const reFetch = await getCollection(db, initial.externalId);
      expect(reFetch.title).toEqual('second iteration');
    });

    it('should update publishedAt when going to published status', async () => {
      const author = await createAuthor(db, 'walter');
      const initial = await createCollection(
        db,
        'first iteration',
        author,
        CollectionStatus.draft
      );

      const data: UpdateCollectionInput = {
        externalId: initial.externalId,
        slug: initial.slug,
        title: 'second iteration',
        authorExternalId: author.externalId,
        status: CollectionStatus.published,
      };

      // publishedAt should have a value
      const updated = await updateCollection(db, data);
      expect(updated.publishedAt).not.toBeFalsy();

      // verify on a re-fetch that the update was persisted
      // is this necessary?
      const reFetch = await getCollection(db, initial.externalId);
      expect(reFetch.publishedAt).not.toBeFalsy();
    });

    it('should not update publishedAt when already published', async () => {
      const author = await createAuthor(db, 'walter');
      const initial = await createCollection(
        db,
        'first iteration',
        author,
        CollectionStatus.draft
      );

      // update the colletion to published
      let data: UpdateCollectionInput = {
        externalId: initial.externalId,
        slug: initial.slug,
        title: 'second iteration',
        authorExternalId: author.externalId,
        status: CollectionStatus.published,
      };

      const published = await updateCollection(db, data);

      // update the colletion title (leaving all other fields the same)
      data = {
        externalId: initial.externalId,
        slug: initial.slug,
        title: 'third iteration',
        authorExternalId: author.externalId,
        status: CollectionStatus.published,
      };

      const updated = await updateCollection(db, data);

      // make sure the publishedAt value hasn't changed
      expect(published.publishedAt).toEqual(updated.publishedAt);
    });

    it('should fail on a duplicate slug', async () => {
      const author = await createAuthor(db, 'walter');

      // this should create a slug of 'let-us-go-bowling'
      const first = await createCollection(
        db,
        'let us go bowling',
        author,
        CollectionStatus.draft
      );

      const second: Collection = await createCollection(
        db,
        'phone is ringing',
        author,
        CollectionStatus.draft
      );

      // try to update the second collection with the same slug as the first
      const data: UpdateCollectionInput = {
        ...second,
        slug: first.slug,
        authorExternalId: author.externalId,
      };

      try {
        await updateCollection(db, data);
        // Fail test if above expression doesn't throw anything.
        expect(true).toBe(false);
      } catch (e) {
        expect(e.message).toBe(
          `A different collection with the slug ${first.slug} already exists`
        );
      }
    });
  });
});
