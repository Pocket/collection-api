import { Collection, CollectionStatus, PrismaClient } from '@prisma/client';
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
  createIABCategoryHelper,
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
  let IABParentCategory;
  let IABChildCategory;

  beforeEach(async () => {
    await clearDb(db);
    author = await createAuthorHelper(db, 'walter');
    curationCategory = await createCurationCategoryHelper(
      db,
      'Personal Finance'
    );
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

    it('should create a collection with an IAB top category', async () => {
      const data: CreateCollectionInput = {
        slug: 'walter-bowls',
        title: 'walter bowls',
        authorExternalId: author.externalId,
        IABParentCategoryId: IABParentCategory.externalId,
      };

      const c = await createCollection(db, data);

      expect(c.IABParentCategory.externalId).toEqual(
        IABParentCategory.externalId
      );
    });

    it('should create a collection with IAB top and sub categories', async () => {
      const data: CreateCollectionInput = {
        slug: 'walter-bowls',
        title: 'walter bowls',
        authorExternalId: author.externalId,
        IABParentCategoryId: IABParentCategory.externalId,
        IABChildCategoryId: IABChildCategory.externalId,
      };

      const c = await createCollection(db, data);

      expect(c.IABParentCategory.externalId).toEqual(
        IABParentCategory.externalId
      );
      expect(c.IABChildCategory.externalId).toEqual(
        IABChildCategory.externalId
      );
    });

    it('should not connect an IAB sub category if an IAB top category is not set', async () => {
      const data: CreateCollectionInput = {
        slug: 'walter-bowls',
        title: 'walter bowls',
        authorExternalId: author.externalId,
        IABChildCategoryId: IABChildCategory.externalId,
      };

      const c = await createCollection(db, data);

      expect(c.IABChildCategory).toBeNull();
    });
  });

  describe('updateCollection', () => {
    it('should update a collection', async () => {
      const initial = await createCollectionHelper(db, {
        title: 'first iteration',
        author,
      });

      const newAuthor = await createAuthorHelper(db, 'Leo Tolstoy');

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
      const initial = await createCollectionHelper(db, {
        title: 'first iteration',
        author,
      });

      const newCurationCategory = await createCurationCategoryHelper(
        db,
        'Travel'
      );

      const newAuthor = await createAuthorHelper(db, 'Leo Tolstoy');

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
      const initial = await createCollectionHelper(db, {
        title: 'first iteration',
        author,
        curationCategory,
      });

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

    it('should update a collection with an IAB top category', async () => {
      const initial = await createCollectionHelper(db, {
        title: 'first iteration',
        author,
      });

      const data: UpdateCollectionInput = {
        externalId: initial.externalId,
        slug: initial.slug,
        title: 'second iteration',
        authorExternalId: author.externalId,
        IABParentCategoryId: IABParentCategory.externalId,
      };

      const updated = await updateCollection(db, data);

      expect(updated.IABParentCategory.name).toEqual(IABParentCategory.name);
    });

    it('should update a collection with IAB top and sub categories', async () => {
      const initial = await createCollectionHelper(db, {
        title: 'first iteration',
        author,
      });

      const data: UpdateCollectionInput = {
        externalId: initial.externalId,
        slug: initial.slug,
        title: 'second iteration',
        authorExternalId: author.externalId,
        IABParentCategoryId: IABParentCategory.externalId,
        IABChildCategoryId: IABChildCategory.externalId,
      };

      const updated = await updateCollection(db, data);

      expect(updated.IABParentCategory.name).toEqual(IABParentCategory.name);
      expect(updated.IABChildCategory.name).toEqual(IABChildCategory.name);
    });

    it('should update a collection and remove IAB categories', async () => {
      const initial = await createCollectionHelper(db, {
        title: 'first iteration',
        author,
        IABParentCategory,
        IABChildCategory,
      });

      const data: UpdateCollectionInput = {
        externalId: initial.externalId,
        slug: initial.slug,
        title: 'second iteration',
        authorExternalId: author.externalId,
      };

      const updated = await updateCollection(db, data);

      expect(updated.IABParentCategory).toBeNull();
      expect(updated.IABChildCategory).toBeNull();
    });

    it('should return all associated data after updating - authors, curation category, IAB categories, stories, and story authors', async () => {
      const initial = await createCollectionHelper(db, {
        title: 'first iteration',
        author,
      });

      const data: UpdateCollectionInput = {
        externalId: initial.externalId,
        slug: initial.slug,
        title: 'second iteration',
        authorExternalId: author.externalId,
        curationCategoryExternalId: curationCategory.externalId,
        IABParentCategoryId: IABParentCategory.externalId,
        IABChildCategoryId: IABChildCategory.externalId,
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
      expect(updated.IABParentCategory).toBeTruthy();
      expect(updated.IABChildCategory).toBeTruthy();
    });

    it('should return story author sorted correctly', async () => {
      const initial = await createCollectionHelper(db, {
        title: 'first iteration',
        author,
      });

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
      const initial = await createCollectionHelper(db, {
        title: 'first iteration',
        author,
      });

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
    });

    it('should not update publishedAt when already published', async () => {
      const initial = await createCollectionHelper(db, {
        title: 'first iteration',
        author,
      });

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
      const first = await createCollectionHelper(db, {
        title: 'let us go bowling',
        author,
      });

      const second: Collection = await createCollectionHelper(db, {
        title: 'phone is ringing',
        author,
      });

      // try to update the second collection with the same slug as the first
      const data: UpdateCollectionInput = {
        title: second.title,
        externalId: second.externalId,
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
      const initial = await createCollectionHelper(db, {
        title: 'first iteration',
        author,
      });
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
      const initial = await createCollectionHelper(db, {
        title: 'first iteration',
        author,
      });

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
