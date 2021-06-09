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
  createCurationCategoryHelper,
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
  let curationCategory;

  beforeEach(async () => {
    await clearDb(db);
    author = await createAuthorHelper(db, { name: 'walter' });
    curationCategory = await createCurationCategoryHelper(db, {
      name: 'Personal Finance',
      slug: 'personal-finance',
    });
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

    it('should store the curation category when provided', async () => {
      const data: CreateCollectionInput = {
        slug: 'walter-bowls',
        title: 'walter bowls',
        authorExternalId: author.externalId,
        curationCategoryExternalId: curationCategory.externalId,
      };

      const collection = await createCollection(db, data);

      expect(collection.curationCategory).not.toBeNull();
    });

    it('should fail on a duplicate slug', async () => {
      // create our first collection
      const data1: CreateCollectionInput = {
        slug: 'walter-bowls',
        title: 'walter bowls',
        authorExternalId: author.externalId,
        curationCategoryExternalId: curationCategory.externalId,
      };

      await createCollection(db, data1);

      // create our second collection, trying to use the same slug
      const data2: CreateCollectionInput = {
        slug: 'walter-bowls',
        title: 'walter bowls, again',
        authorExternalId: author.externalId,
        curationCategoryExternalId: curationCategory.externalId,
      };

      await expect(createCollection(db, data2)).rejects.toThrow(
        `A collection with the slug "${data2.slug}" already exists`
      );
    });

    it('should return authors, stories and curation category when a collection is created', async () => {
      const data: CreateCollectionInput = {
        slug: 'walter-bowls',
        title: 'walter bowls',
        authorExternalId: author.externalId,
        curationCategoryExternalId: curationCategory.externalId,
      };

      const collection = await createCollection(db, data);

      expect(collection.authors).toBeTruthy();
      expect(collection.curationCategory).toBeTruthy();
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
        author,
        CollectionStatus.DRAFT
      );

      const newAuthor = await createAuthorHelper(db, { name: 'Leo Tolstoy' });

      const data: UpdateCollectionInput = {
        externalId: initial.externalId,
        slug: initial.slug,
        title: 'second iteration',
        authorExternalId: newAuthor.externalId,
      };

      // should return the updated info
      const updated = await updateCollection(db, data);
      expect(updated.title).toEqual('second iteration');

      // should return the updated author
      expect(updated.authors[0].name).toEqual(newAuthor.name);

      // should have updated the updatedAt field
      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        initial.updatedAt.getTime()
      );
    });

    it('should update a collection with a curation category', async () => {
      const initial = await createCollectionHelper(
        db,
        'first iteration',
        author,
        CollectionStatus.DRAFT
      );

      const newCurationCategory = await createCurationCategoryHelper(db, {
        name: 'Travel',
        slug: 'travel',
      });

      const newAuthor = await createAuthorHelper(db, { name: 'Leo Tolstoy' });

      const data: UpdateCollectionInput = {
        externalId: initial.externalId,
        slug: initial.slug,
        title: 'second iteration',
        authorExternalId: newAuthor.externalId,
        curationCategoryExternalId: newCurationCategory.externalId,
      };

      const updated = await updateCollection(db, data);

      // make sure a curation category was connected
      // should return the updated curation category
      expect(updated.curationCategory.name).toEqual(newCurationCategory.name);
    });

    it('should update a collection and remove a curation category', async () => {
      const initial = await createCollectionHelper(
        db,
        'first iteration',
        author,
        CollectionStatus.DRAFT,
        curationCategory
      );

      const data: UpdateCollectionInput = {
        externalId: initial.externalId,
        slug: initial.slug,
        title: 'second iteration',
        authorExternalId: author.externalId,
      };

      const updated = await updateCollection(db, data);

      // make sure a curation category was disconnected
      expect(updated.curationCategory).toBeNull();
    });

    it('should return all associated data after updating - authors, curation category, stories, and story authors', async () => {
      const initial = await createCollectionHelper(
        db,
        'first iteration',
        author,
        CollectionStatus.DRAFT,
        curationCategory
      );

      const data: UpdateCollectionInput = {
        externalId: initial.externalId,
        slug: initial.slug,
        title: 'second iteration',
        authorExternalId: author.externalId,
        curationCategoryExternalId: curationCategory.externalId,
      };

      // should return the updated info
      const updated = await updateCollection(db, data);

      expect(updated.authors.length).toBeGreaterThan(0);
      expect(updated.stories.length).toBeGreaterThan(0);

      for (let i = 0; i < updated.stories.length; i++) {
        expect(updated.stories[i].authors).toBeTruthy();
        expect(updated.stories[i].authors.length).toBeGreaterThan(0);
      }
      expect(updated.curationCategory).toBeTruthy();
    });

    it('should return story author sorted correctly', async () => {
      const initial = await createCollectionHelper(
        db,
        'first iteration',
        author,
        CollectionStatus.DRAFT,
        curationCategory
      );

      const data: UpdateCollectionInput = {
        externalId: initial.externalId,
        slug: initial.slug,
        title: 'second iteration',
        authorExternalId: author.externalId,
        curationCategoryExternalId: curationCategory.externalId,
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
        CollectionStatus.DRAFT,
        curationCategory
      );

      const data: UpdateCollectionInput = {
        externalId: initial.externalId,
        slug: initial.slug,
        title: 'second iteration',
        authorExternalId: author.externalId,
        curationCategoryExternalId: curationCategory.externalId,
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
        CollectionStatus.DRAFT,
        curationCategory
      );

      // update the collection to published
      let data: UpdateCollectionInput = {
        externalId: initial.externalId,
        slug: initial.slug,
        title: 'second iteration',
        authorExternalId: author.externalId,
        curationCategoryExternalId: curationCategory.externalId,
        status: CollectionStatus.PUBLISHED,
      };

      const published = await updateCollection(db, data);

      // update the collection title (leaving all other fields the same)
      data = {
        externalId: initial.externalId,
        slug: initial.slug,
        title: 'third iteration',
        authorExternalId: author.externalId,
        curationCategoryExternalId: curationCategory.externalId,
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
        CollectionStatus.DRAFT,
        curationCategory
      );

      const second: Collection = await createCollectionHelper(
        db,
        'phone is ringing',
        author,
        CollectionStatus.DRAFT,
        curationCategory
      );

      // try to update the second collection with the same slug as the first
      const data: UpdateCollectionInput = {
        ...second,
        slug: first.slug,
        authorExternalId: author.externalId,
        curationCategoryExternalId: curationCategory.externalId,
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
        author,
        CollectionStatus.DRAFT,
        curationCategory
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
        author,
        CollectionStatus.DRAFT,
        curationCategory
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
