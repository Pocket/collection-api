import { PrismaClient, Collection, CollectionStatus } from '@prisma/client';
import { getCollection } from './queries';
import {
  CreateCollectionAuthorInput,
  CreateCollectionInput,
  UpdateCollectionAuthorInput,
  UpdateCollectionInput,
} from './types';
import {
  clear as clearDb,
  createAuthorHelper,
  createCollectionHelper,
} from '../test/helpers';
import {
  createAuthor,
  createCollection,
  updateAuthor,
  updateCollection,
} from './mutations';

const db = new PrismaClient();

describe('mutations', () => {
  beforeEach(async () => {
    await clearDb(db);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe('collection author mutations', () => {
    describe('createAuthor', () => {
      it('should create a collection author with a default slug', async () => {
        const data: CreateCollectionAuthorInput = {
          name: 'the dude',
        };

        const author = await createAuthor(db, data);

        expect(author.name).toEqual('the dude');
        expect(author.slug).toEqual('the-dude');
      });

      it('should create a collection author with all fields specified', async () => {
        const data: CreateCollectionAuthorInput = {
          name: 'the dude',
          slug: 'his-dudeness',
          bio: 'the dude abides',
          imageUrl: 'https://i.imgur.com/YeydXfW.gif',
        };

        const author = await createAuthor(db, data);

        expect(author.name).toEqual('the dude');
        expect(author.slug).toEqual('his-dudeness');
        expect(author.bio).toEqual('the dude abides');
        expect(author.imageUrl).toEqual('https://i.imgur.com/YeydXfW.gif');
      });

      it('should fail to create a collection author on duplicate slug', async () => {
        const data: CreateCollectionAuthorInput = {
          name: 'the dude',
          slug: 'his-dudeness',
        };

        await createAuthor(db, data);

        // change the name just because
        data.name = 'walter man';

        // should fail trying to create an author with the same slug
        await expect(createAuthor(db, data)).rejects.toThrow(
          `An author with the slug "${data.slug}" already exists`
        );
      });
    });

    describe('updateAuthor', () => {
      it('should update a collection author', async () => {
        const author = await createAuthorHelper(db, 'the dude');

        const data: UpdateCollectionAuthorInput = {
          externalId: author.externalId,
          name: 'el duderino',
          bio: 'he abides, man',
        };

        const updated = await updateAuthor(db, data);

        expect(updated.name).toEqual(data.name);
        expect(updated.bio).toEqual(data.bio);
      });

      it('should not auto-regenerate a slug on update', async () => {
        const author = await createAuthorHelper(db, 'the dude');

        const data: UpdateCollectionAuthorInput = {
          externalId: author.externalId,
          name: 'el duderino',
        };

        const updated = await updateAuthor(db, data);

        // even though the name changed, the slug should not
        expect(updated.slug).toEqual(author.slug);
      });

      it('should update to a specified collection author slug', async () => {
        const author = await createAuthorHelper(db, 'the dude');

        const data: UpdateCollectionAuthorInput = {
          externalId: author.externalId,
          name: 'el duderino',
          slug: 'his-dudeness',
        };

        const updated = await updateAuthor(db, data);

        expect(updated.slug).toEqual(data.slug);
      });

      it('should fail to update a collection author slug if another author has that slug', async () => {
        // will create a slug of 'the-dude'
        await createAuthorHelper(db, 'the dude');
        // will create a slug of 'walter'
        const author2 = await createAuthorHelper(db, 'walter');

        // try to make walter's slug 'the-dude'
        const data: UpdateCollectionAuthorInput = {
          externalId: author2.externalId,
          name: author2.name,
          slug: 'the-dude',
        };

        // should fail trying to make walter's slug 'the dude'
        // there's only one the dude
        await expect(updateAuthor(db, data)).rejects.toThrow(
          `An author with the slug "${data.slug}" already exists`
        );
      });
    });
  });

  describe('collection mutations', () => {
    let author;

    beforeEach(async () => {
      author = await createAuthorHelper(db, 'walter');
    });

    describe('createCollection', () => {
      it('should create a collection with a default status of `draft`', async () => {
        const data: CreateCollectionInput = {
          slug: 'walter-bowls',
          title: 'walter bowls',
          authorExternalId: author.externalId,
        };

        const collection = await createCollection(db, data);

        expect(collection).not.toBeNull();
        expect(collection.status).toEqual(CollectionStatus.DRAFT);
      });

      it('should create a collection with a null publishedAt', async () => {
        const data: CreateCollectionInput = {
          slug: 'walter-bowls',
          title: 'walter bowls',
          authorExternalId: author.externalId,
        };
        const collection = await createCollection(db, data);

        expect(collection.publishedAt).toBeFalsy();
      });

      it('should fail on a duplicate slug', async () => {
        // create our first collection
        const data1: CreateCollectionInput = {
          slug: 'walter-bowls',
          title: 'walter bowls',
          authorExternalId: author.externalId,
        };

        await createCollection(db, data1);

        // create our second collection, trying to use the same slug
        const data2: CreateCollectionInput = {
          slug: 'walter-bowls',
          title: 'walter bowls, again',
          authorExternalId: author.externalId,
        };

        await expect(createCollection(db, data2)).rejects.toThrow(
          `A collection with the slug ${data2.slug} already exists`
        );
      });
    });

    describe('updateCollection', () => {
      it('should update a collection', async () => {
        const initial = await createCollectionHelper(
          db,
          'first iteration',
          author
        );

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
        const initial = await createCollectionHelper(
          db,
          'first iteration',
          author,
          CollectionStatus.DRAFT
        );

        const data: UpdateCollectionInput = {
          externalId: initial.externalId,
          slug: initial.slug,
          title: 'second iteration',
          authorExternalId: author.externalId,
          status: CollectionStatus.PUBLISHED,
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
        const initial = await createCollectionHelper(
          db,
          'first iteration',
          author,
          CollectionStatus.DRAFT
        );

        // update the colletion to published
        let data: UpdateCollectionInput = {
          externalId: initial.externalId,
          slug: initial.slug,
          title: 'second iteration',
          authorExternalId: author.externalId,
          status: CollectionStatus.PUBLISHED,
        };

        const published = await updateCollection(db, data);

        // update the colletion title (leaving all other fields the same)
        data = {
          externalId: initial.externalId,
          slug: initial.slug,
          title: 'third iteration',
          authorExternalId: author.externalId,
          status: CollectionStatus.PUBLISHED,
        };

        const updated = await updateCollection(db, data);

        // make sure the publishedAt value hasn't changed
        expect(published.publishedAt).toEqual(updated.publishedAt);
      });

      it('should fail on a duplicate slug', async () => {
        // this should create a slug of 'let-us-go-bowling'
        const first = await createCollectionHelper(
          db,
          'let us go bowling',
          author,
          CollectionStatus.DRAFT
        );

        const second: Collection = await createCollectionHelper(
          db,
          'phone is ringing',
          author,
          CollectionStatus.DRAFT
        );

        // try to update the second collection with the same slug as the first
        const data: UpdateCollectionInput = {
          ...second,
          slug: first.slug,
          authorExternalId: author.externalId,
        };

        await expect(updateCollection(db, data)).rejects.toThrow(
          `A collection with the slug ${first.slug} already exists`
        );
      });
    });
  });
});
