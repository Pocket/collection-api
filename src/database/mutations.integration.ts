import { PrismaClient, CollectionStatus } from '@prisma/client';
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

      // verify on a re-fetch that the update was persisted
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

      // should return the updated info
      const updated = await updateCollection(db, data);
      expect(updated.publishedAt).not.toBeFalsy();

      // verify on a re-fetch that the update was persisted
      const reFetch = await getCollection(db, initial.externalId);
      expect(reFetch.publishedAt).not.toBeFalsy();
    });

    it('should not update publishedAt when already published', async () => {
      const author = await createAuthor(db, 'walter');
      const initial = await createCollection(
        db,
        'first iteration',
        author,
        CollectionStatus.published
      );

      expect(initial.publishedAt).not.toBeFalsy();

      const data: UpdateCollectionInput = {
        externalId: initial.externalId,
        slug: initial.slug,
        title: 'second iteration',
        authorExternalId: author.externalId,
        status: CollectionStatus.published,
      };

      // should return the updated info
      const updated = await updateCollection(db, data);
      expect(updated.publishedAt).toEqual(initial.publishedAt);
    });
  });
});
