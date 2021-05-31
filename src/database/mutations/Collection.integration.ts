import { Collection, CollectionStatus, PrismaClient } from '@prisma/client';
import { getCollection } from '../queries';
import {
  CreateCollectionInput,
  UpdateCollectionImageUrlInput,
  UpdateCollectionInput,
} from '../types';
import {
  clear as clearDb,
  createAuthorHelper,
  createCollectionHelper,
  sortCollectionStoryAuthors,
} from '../../test/helpers';
import {
  createCollection,
  updateCollection,
  updateCollectionImageUrl,
} from './Collection';

const db = new PrismaClient();

describe('mutations: Collection', () => {
  let author;

  beforeEach(async () => {
    await clearDb(db);
    author = await createAuthorHelper(db, 'walter');
  });

  afterAll(async () => {
    await db.$disconnect();
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
        `A collection with the slug "${data2.slug}" already exists`
      );
    });

    it('should return authors and stories when a collection is created', async () => {
      const data: CreateCollectionInput = {
        slug: 'walter-bowls',
        title: 'walter bowls',
        authorExternalId: author.externalId,
      };
      const collection = await createCollection(db, data);

      expect(collection.authors).toBeTruthy();
      expect(collection.stories).toBeTruthy();
      // there will never be stories on a freshly created collection
      expect(collection.stories.length).toEqual(0);
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

    it('should return all associated data after updating - authors, stories, and story authors', async () => {
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

      expect(updated.authors.length).toBeGreaterThan(0);
      expect(updated.stories.length).toBeGreaterThan(0);

      for (let i = 0; i < updated.stories.length; i++) {
        expect(updated.stories[i].authors).toBeTruthy();
        expect(updated.stories[i].authors.length).toBeGreaterThan(0);
      }
    });

    it('should return story author sorted correctly', async () => {
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

      expect(updated.stories[0].authors).toEqual(
        sortCollectionStoryAuthors(updated.stories[0].authors)
      );
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

      // update the collection to published
      let data: UpdateCollectionInput = {
        externalId: initial.externalId,
        slug: initial.slug,
        title: 'second iteration',
        authorExternalId: author.externalId,
        status: CollectionStatus.PUBLISHED,
      };

      const published = await updateCollection(db, data);

      // update the collection title (leaving all other fields the same)
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
        `A collection with the slug "${first.slug}" already exists`
      );
    });
  });

  describe('updateCollectionImageUrl', () => {
    it('should update a collection image url', async () => {
      const initial = await createCollectionHelper(
        db,
        'first iteration',
        author
      );
      const randomKitten = 'https://placekitten.com/g/200/300';

      const data: UpdateCollectionImageUrlInput = {
        externalId: initial.externalId,
        imageUrl: randomKitten,
      };

      // should return the updated info
      const updated = await updateCollectionImageUrl(db, data);

      expect(updated.imageUrl).toEqual(data.imageUrl);

      // should have updated the updatedAt field
      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        initial.updatedAt.getTime()
      );
    });

    it('should not update any other collection fields', async () => {
      const initial = await createCollectionHelper(
        db,
        'first iteration',
        author
      );
      const randomKitten = 'https://placekitten.com/g/200/300';

      const data: UpdateCollectionImageUrlInput = {
        externalId: initial.externalId,
        imageUrl: randomKitten,
      };

      // should return the updated info
      const updated = await updateCollectionImageUrl(db, data);

      expect(updated.title).toEqual(initial.title);
      expect(updated.slug).toEqual(initial.slug);
      expect(updated.excerpt).toEqual(initial.excerpt);
      expect(updated.intro).toEqual(initial.intro);
      expect(updated.status).toEqual(initial.status);
    });
  });
});
