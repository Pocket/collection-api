import { PrismaClient } from '@prisma/client';
import { getCollectionStory } from '../queries';
import {
  CreateCollectionStoryInput,
  UpdateCollectionStoryInput,
} from '../types';
import {
  clear as clearDb,
  createAuthorHelper,
  createCollectionHelper,
} from '../../test/helpers';
import {
  createCollectionStory,
  deleteCollectionStory,
  updateCollectionStory,
  updateCollectionStorySortOrder,
} from './CollectionStory';
import { createCollection } from './Collection';

const db = new PrismaClient();

describe('mutations: CollectionStory', () => {
  let collection;

  beforeEach(async () => {
    await clearDb(db);

    const author = await createAuthorHelper(db, 'maude');
    collection = await createCollectionHelper(
      db,
      'a collection: by maude',
      author
    );
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe('createCollectionStory', () => {
    let data: CreateCollectionStoryInput;

    beforeEach(async () => {
      data = {
        collectionExternalId: collection.externalId,
        url: 'https://www.lebowskifest.com/',
        title: 'lebowski fest',
        excerpt: 'when will the next fest be?',
        imageUrl: 'idk',
        authors: [
          { name: 'donny', sortOrder: 1 },
          { name: 'walter', sortOrder: 2 },
        ],
        publisher: 'little lebowskis',
      };
    });

    it('should create a collection story', async () => {
      const story = await createCollectionStory(db, data);

      // it should be properly mapped to the collection
      expect(story.collectionId).toEqual(collection.id);

      // default sort order of 0 should be there
      expect(story.sortOrder).toEqual(0);
    });

    it('should create a collection story with a default sort order', async () => {
      const story = await createCollectionStory(db, data);

      // default sort order of 0 should be there
      expect(story.sortOrder).toEqual(0);
    });

    it('should return story authors sorted correctly', async () => {
      const story = await createCollectionStory(db, data);

      // it should have the specified authors
      expect(story.authors.length).toBeGreaterThan(0);

      // (authors are returned sorted by sortOrder asc)
      expect(story.authors[0].name).toEqual('donny');
      expect(story.authors[1].name).toEqual('walter');

      // default sort order of 0 should be there
      expect(story.sortOrder).toEqual(0);
    });

    it('should create a collection story with a sort order', async () => {
      data.sortOrder = 4;

      const story = await createCollectionStory(db, data);

      expect(story.sortOrder).toEqual(4);
    });

    it('should fail adding the same url to the same collection', async () => {
      await createCollectionStory(db, data);

      await expect(createCollectionStory(db, data)).rejects.toThrow(
        `A story with the url "${data.url}" already exists in this collection`
      );
    });
  });

  describe('updateCollectionStory', () => {
    let story;

    beforeEach(async () => {
      const data: CreateCollectionStoryInput = {
        collectionExternalId: collection.externalId,
        url: 'https://www.lebowskifest.com/',
        title: 'lebowski fest',
        excerpt: 'when will the next fest be?',
        imageUrl: 'idk',
        authors: [
          { name: 'donny', sortOrder: 1 },
          { name: 'walter', sortOrder: 2 },
        ],
        publisher: 'little lebowskis',
        sortOrder: 4,
      };

      story = await createCollectionStory(db, data);
    });

    it('should update a collection story', async () => {
      const updateData: UpdateCollectionStoryInput = {
        externalId: story.externalId,
        url: 'https://www.lebowskifest.com/bowling',
        title: 'a fest of lebowskis',
        excerpt: 'new excerpt',
        imageUrl: 'new image url',
        authors: [
          { name: 'brandt', sortOrder: 1 },
          { name: 'karl', sortOrder: 2 },
        ],
        publisher: 'the cast',
        sortOrder: 3,
      };

      const updated = await updateCollectionStory(db, updateData);

      expect(updated.url).toEqual(updateData.url);
      expect(updated.title).toEqual(updateData.title);
      expect(updated.excerpt).toEqual(updateData.excerpt);
      expect(updated.imageUrl).toEqual(updateData.imageUrl);
      expect(updated.publisher).toEqual(updateData.publisher);
      expect(updated.sortOrder).toEqual(updateData.sortOrder);
    });

    it('should update the collection story authors and return them properly sorted', async () => {
      const updateData: UpdateCollectionStoryInput = {
        externalId: story.externalId,
        url: 'https://www.lebowskifest.com/bowling',
        title: 'a fest of lebowskis',
        excerpt: 'new excerpt',
        imageUrl: 'new image url',
        authors: [
          { name: 'brandt', sortOrder: 1 },
          { name: 'karl', sortOrder: 2 },
          { name: 'maude', sortOrder: 6 },
        ],
        publisher: 'the cast',
        sortOrder: 3,
      };

      const updated = await updateCollectionStory(db, updateData);

      expect(updated.authors.length).toEqual(3);
      // (authors are returned sorted by sortOrder asc)
      expect(updated.authors[0].name).toEqual('brandt');
      expect(updated.authors[1].name).toEqual('karl');
      expect(updated.authors[2].name).toEqual('maude');
    });

    it('should fail adding the same url to the same collection', async () => {
      // Create another story first
      const createData: CreateCollectionStoryInput = {
        collectionExternalId: collection.externalId,
        url: 'https://www.anything-goes.com/',
        title: 'anything goes',
        excerpt: 'why would this even be a thing?',
        imageUrl: 'idk',
        authors: [
          { name: 'donny', sortOrder: 1 },
          { name: 'walter', sortOrder: 2 },
        ],
        publisher: 'random penguin',
        sortOrder: 5,
      };

      await createCollectionStory(db, createData);

      // Update the test story with the newly added story's URL
      const updateData: UpdateCollectionStoryInput = {
        externalId: story.externalId,
        url: 'https://www.anything-goes.com/',
        title: 'a fest of lebowskis',
        excerpt: 'new excerpt',
        imageUrl: '',
        authors: [
          { name: 'brandt', sortOrder: 1 },
          { name: 'karl', sortOrder: 2 },
        ],
        publisher: 'random penguin',
        sortOrder: 1,
      };

      // Return a custom error message instead of "Unique constraint failed..."
      await expect(updateCollectionStory(db, updateData)).rejects.toThrow(
        `A story with the url "${updateData.url}" already exists in this collection`
      );
    });
  });

  describe('updateCollectionStorySortOrder', () => {
    let story;

    beforeEach(async () => {
      const data: CreateCollectionStoryInput = {
        collectionExternalId: collection.externalId,
        url: 'https://www.lebowskifest.com/',
        title: 'lebowski fest',
        excerpt: 'when will the next fest be?',
        imageUrl: 'idk',
        authors: [
          { name: 'donny', sortOrder: 1 },
          { name: 'walter', sortOrder: 2 },
        ],
        publisher: 'little lebowskis',
        sortOrder: 4,
      };

      story = await createCollectionStory(db, data);
    });

    it('should update the sortOrder of a collection story', async () => {
      const updated = await updateCollectionStorySortOrder(db, {
        externalId: story.externalId,
        sortOrder: story.sortOrder + 1,
      });

      expect(updated.sortOrder).toEqual(story.sortOrder + 1);
    });

    it('should not update any other properties when updating sortOrder', async () => {
      const updated = await updateCollectionStorySortOrder(db, {
        externalId: story.externalId,
        sortOrder: 3,
      });

      expect(updated.title).toEqual(story.title);
      expect(updated.url).toEqual(story.url);
      expect(updated.excerpt).toEqual(story.excerpt);
      expect(updated.imageUrl).toEqual(story.imageUrl);
      expect(updated.authors).toEqual(story.authors);
      expect(updated.publisher).toEqual(story.publisher);
    });
  });

  describe('deleteCollectionStory', () => {
    let story;

    beforeEach(async () => {
      const data: CreateCollectionStoryInput = {
        collectionExternalId: collection.externalId,
        url: 'https://www.lebowskifest.com/',
        title: 'lebowski fest',
        excerpt: 'when will the next fest be?',
        imageUrl: 'idk',
        authors: [
          { name: 'donny', sortOrder: 1 },
          { name: 'walter', sortOrder: 2 },
        ],
        publisher: 'little lebowskis',
        sortOrder: 4,
      };

      story = await createCollectionStory(db, data);
    });

    it('should delete a collection story and return the deleted data', async () => {
      const result = await deleteCollectionStory(db, story.externalId);

      // should have direct model data
      expect(result.title).toEqual(story.title);

      // should have related author data
      expect(result.authors.length).toBeGreaterThan(0);

      // make sure the story is really gone
      const found = await getCollectionStory(db, story.externalId);

      expect(found).toBeFalsy();
    });

    it('should delete a collection story and return the story authors sorted correctly', async () => {
      const result = await deleteCollectionStory(db, story.externalId);

      // (authors are returned sorted by sortOrder asc)
      expect(result.authors[0].name).toEqual('donny');
      expect(result.authors[1].name).toEqual('walter');
    });

    it('should delete all related collection story authors', async () => {
      await deleteCollectionStory(db, story.externalId);

      const relatedAuthors = db.collectionStoryAuthor.findMany({
        where: {
          collectionStoryId: story.id,
        },
      });

      expect((await relatedAuthors).length).toEqual(0);
    });

    it('should fail to delete a collection story if the externalId cannot be found', async () => {
      await expect(
        deleteCollectionStory(db, story.externalId + 'typo')
      ).rejects.toThrow();
    });
  });
});
