import { expect } from 'chai';

import { Collection, CollectionStatus } from '@prisma/client';

import { db } from '../../../test/admin-server';
import {
  clear as clearDb,
  getServerWithMockedHeaders,
  createAuthorHelper,
  createCollectionHelper,
  createCurationCategoryHelper,
  createIABCategoryHelper,
  sortCollectionStoryAuthors,
} from '../../../test/helpers';
import {
  CollectionLanguage,
  UpdateCollectionImageUrlInput,
  UpdateCollectionInput,
} from '../../../database/types';
import { COLLECTION_CURATOR_FULL } from '../../../shared/constants';
import {
  CREATE_COLLECTION,
  UPDATE_COLLECTION,
  UPDATE_COLLECTION_IMAGE_URL,
} from './sample-mutations.gql';
import { updateCollection } from '../../../database/mutations/Collection';

describe('mutations: Collection', () => {
  let author;
  let curationCategory;
  let IABParentCategory;
  let IABChildCategory;
  let minimumData;

  const headers = {
    name: 'Test User',
    username: 'test.user@test.com',
    groups: `group1,group2,${COLLECTION_CURATOR_FULL}`,
  };

  const server = getServerWithMockedHeaders(headers);

  afterAll(async () => {
    await db.$disconnect();
  });

  beforeEach(async () => {
    await clearDb(db);

    // re-create our dependent entities
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

    // re-create the minimum data necessary to create a collection
    minimumData = {
      authorExternalId: author.externalId,
      language: CollectionLanguage.EN,
      slug: 'walter-bowls',
      title: 'walter bowls',
    };
  });

  describe('createCollection', () => {
    it('should create a collection with a default status of `draft`', async () => {
      const { data } = await server.executeOperation({
        query: CREATE_COLLECTION,
        variables: { data: minimumData },
      });

      expect(data.createCollection).to.exist;
      expect(data.createCollection.status).to.equal(CollectionStatus.DRAFT);
    });

    it('should create a collection with a null publishedAt', async () => {
      const { data } = await server.executeOperation({
        query: CREATE_COLLECTION,
        variables: { data: minimumData },
      });

      expect(data.createCollection.publishedAt).not.to.exist;
    });

    it('should store the curation category when provided', async () => {
      const { data } = await server.executeOperation({
        query: CREATE_COLLECTION,
        variables: {
          data: {
            ...minimumData,
            curationCategoryExternalId: curationCategory.externalId,
          },
        },
      });

      expect(data.createCollection.curationCategory).to.exist;
    });

    it('should fail on a duplicate slug', async () => {
      await createCollectionHelper(db, {
        title: minimumData.title,
        author,
      });

      // create our second collection, trying to use the same slug
      const data = await server.executeOperation({
        query: CREATE_COLLECTION,
        variables: { data: minimumData },
      });

      expect(data.data).not.to.exist;
      expect(data.errors.length).to.equal(1);
      expect(data.errors[0].message).to.equal(
        'A collection with the slug "walter-bowls" already exists'
      );
    });

    it('should return authors, stories and curation category when a collection is created', async () => {
      const { data } = await server.executeOperation({
        query: CREATE_COLLECTION,
        variables: {
          data: {
            ...minimumData,
            curationCategoryExternalId: curationCategory.externalId,
          },
        },
      });

      expect(data.createCollection.authors).to.exist;
      expect(data.createCollection.curationCategory.externalId).to.equal(
        curationCategory.externalId
      );
      expect(data.createCollection.stories).to.exist;
      // there will never be stories on a freshly created collection
      expect(data.createCollection.stories.length).to.equal(0);
    });

    it('should create a collection with an IAB parent category', async () => {
      const { data } = await server.executeOperation({
        query: CREATE_COLLECTION,
        variables: {
          data: {
            ...minimumData,
            IABParentCategoryExternalId: IABParentCategory.externalId,
          },
        },
      });

      expect(data.createCollection.IABParentCategory.externalId).to.equal(
        IABParentCategory.externalId
      );
    });

    it('should create a collection with IAB parent and child categories', async () => {
      const { data } = await server.executeOperation({
        query: CREATE_COLLECTION,
        variables: {
          data: {
            ...minimumData,
            IABParentCategoryExternalId: IABParentCategory.externalId,
            IABChildCategoryExternalId: IABChildCategory.externalId,
          },
        },
      });

      expect(data.createCollection.IABParentCategory.externalId).to.equal(
        IABParentCategory.externalId
      );

      expect(data.createCollection.IABChildCategory.externalId).to.equal(
        IABChildCategory.externalId
      );
    });

    it('should not connect an IAB child category if an IAB parent category is not set', async () => {
      const { data } = await server.executeOperation({
        query: CREATE_COLLECTION,
        variables: {
          data: {
            ...minimumData,
            IABChildCategoryExternalId: IABChildCategory.externalId,
          },
        },
      });

      expect(data.createCollection.IABChildCategory).not.to.exist;
    });

    it('should not connect a partnership', async () => {
      const { data } = await server.executeOperation({
        query: CREATE_COLLECTION,
        variables: {
          data: minimumData,
        },
      });

      expect(data.createCollection.partnership).not.to.exist;
    });
  });

  describe('updateCollection', () => {
    let initial: Collection;

    beforeEach(async () => {
      initial = await createCollectionHelper(db, {
        title: 'first iteration',
        author,
      });
    });

    it('should update a collection', async () => {
      const newAuthor = await createAuthorHelper(db, 'Leo Tolstoy');

      const input: UpdateCollectionInput = {
        authorExternalId: newAuthor.externalId,
        externalId: initial.externalId,
        language: CollectionLanguage.DE,
        slug: initial.slug,
        title: 'second iteration',
        excerpt: 'once upon a time, the internet...',
        status: CollectionStatus.DRAFT,
      };

      const { data } = await server.executeOperation({
        query: UPDATE_COLLECTION,
        variables: {
          data: input,
        },
      });

      // should return the updated info
      expect(data.updateCollection.title).to.equal('second iteration');
      expect(data.updateCollection.language).to.equal('DE');

      // should return the updated author
      expect(data.updateCollection.authors[0].name).to.equal(newAuthor.name);
    });

    it('should update the updatedAt value', async () => {
      const input: UpdateCollectionInput = {
        authorExternalId: author.externalId,
        externalId: initial.externalId,
        language: CollectionLanguage.DE,
        slug: initial.slug,
        title: 'second iteration',
        excerpt: 'once upon a time, the internet...',
        status: CollectionStatus.DRAFT,
      };

      // updatedAt is not a part of our API schema, but it's important to
      // test that this value is being updated, as it's used in sorting
      // results sent back to public clients
      const updated = await updateCollection(db, input);

      // should have updated the updatedAt field
      expect(updated.updatedAt.getTime()).to.be.greaterThan(
        initial.updatedAt.getTime()
      );
    });

    it('should update a collection with a curation category', async () => {
      const newCurationCategory = await createCurationCategoryHelper(
        db,
        'Travel'
      );

      const newAuthor = await createAuthorHelper(db, 'Leo Tolstoy');

      const input: UpdateCollectionInput = {
        authorExternalId: newAuthor.externalId,
        curationCategoryExternalId: newCurationCategory.externalId,
        externalId: initial.externalId,
        language: CollectionLanguage.EN,
        slug: initial.slug,
        title: 'second iteration',
        excerpt: 'once upon a time, the internet...',
        status: CollectionStatus.DRAFT,
      };

      const { data } = await server.executeOperation({
        query: UPDATE_COLLECTION,
        variables: {
          data: input,
        },
      });

      // make sure a curation category was connected
      // should return the updated curation category
      expect(data.updateCollection.curationCategory.name).to.equal(
        newCurationCategory.name
      );
    });

    it('should update a collection and remove a curation category', async () => {
      const input: UpdateCollectionInput = {
        authorExternalId: author.externalId,
        externalId: initial.externalId,
        language: CollectionLanguage.EN,
        slug: initial.slug,
        title: 'second iteration',
        excerpt: 'once upon a time, the internet...',
        status: CollectionStatus.DRAFT,
      };

      const { data } = await server.executeOperation({
        query: UPDATE_COLLECTION,
        variables: {
          data: input,
        },
      });

      // make sure a curation category was disconnected
      expect(data.updateCollection.curationCategory).not.to.exist;
    });

    it('should update a collection with an IAB parent category', async () => {
      const input: UpdateCollectionInput = {
        IABParentCategoryExternalId: IABParentCategory.externalId,
        authorExternalId: author.externalId,
        externalId: initial.externalId,
        language: CollectionLanguage.EN,
        slug: initial.slug,
        title: 'second iteration',
        excerpt: 'once upon a time, the internet...',
        status: CollectionStatus.DRAFT,
      };

      const { data } = await server.executeOperation({
        query: UPDATE_COLLECTION,
        variables: {
          data: input,
        },
      });

      expect(data.updateCollection.IABParentCategory.name).to.equal(
        IABParentCategory.name
      );
    });

    it('should update a collection with IAB parent and child categories', async () => {
      const input: UpdateCollectionInput = {
        IABChildCategoryExternalId: IABChildCategory.externalId,
        IABParentCategoryExternalId: IABParentCategory.externalId,
        authorExternalId: author.externalId,
        externalId: initial.externalId,
        language: CollectionLanguage.EN,
        slug: initial.slug,
        title: 'second iteration',
        excerpt: 'once upon a time, the internet...',
        status: CollectionStatus.DRAFT,
      };

      const { data } = await server.executeOperation({
        query: UPDATE_COLLECTION,
        variables: {
          data: input,
        },
      });

      expect(data.updateCollection.IABParentCategory.name).to.equal(
        IABParentCategory.name
      );
      expect(data.updateCollection.IABChildCategory.name).to.equal(
        IABChildCategory.name
      );
    });

    it('should update a collection and remove IAB categories', async () => {
      // custom initial collection with IAB details set
      const initial = await createCollectionHelper(db, {
        title: 'first iteration with iab categories',
        author,
        IABParentCategory,
        IABChildCategory,
      });

      const input: UpdateCollectionInput = {
        authorExternalId: author.externalId,
        externalId: initial.externalId,
        language: CollectionLanguage.DE,
        slug: initial.slug,
        title: 'second iteration',
        excerpt: 'once upon a time, the internet...',
        status: CollectionStatus.DRAFT,
      };

      const { data } = await server.executeOperation({
        query: UPDATE_COLLECTION,
        variables: {
          data: input,
        },
      });

      expect(data.updateCollection.IABParentCategory).not.to.exist;
      expect(data.updateCollection.IABChildCategory).not.to.exist;
    });

    it('should return all associated data after updating - authors, curation category, IAB categories, stories, and story authors', async () => {
      const input: UpdateCollectionInput = {
        IABChildCategoryExternalId: IABChildCategory.externalId,
        IABParentCategoryExternalId: IABParentCategory.externalId,
        authorExternalId: author.externalId,
        curationCategoryExternalId: curationCategory.externalId,
        externalId: initial.externalId,
        language: CollectionLanguage.DE,
        slug: initial.slug,
        title: 'second iteration',
        excerpt: 'once upon a time, the internet...',
        status: CollectionStatus.DRAFT,
      };

      // should return the updated info
      const { data } = await server.executeOperation({
        query: UPDATE_COLLECTION,
        variables: {
          data: input,
        },
      });

      expect(data.updateCollection.authors.length).to.be.greaterThan(0);
      expect(data.updateCollection.stories.length).to.be.greaterThan(0);

      for (let i = 0; i < data.updateCollection.stories.length; i++) {
        expect(data.updateCollection.stories[i].authors).to.exist;
        expect(
          data.updateCollection.stories[i].authors.length
        ).to.be.greaterThan(0);
      }
      expect(data.updateCollection.curationCategory).to.exist;
      expect(data.updateCollection.IABParentCategory).to.exist;
      expect(data.updateCollection.IABChildCategory).to.exist;
    });

    it('should return story author sorted correctly', async () => {
      const input: UpdateCollectionInput = {
        authorExternalId: author.externalId,
        externalId: initial.externalId,
        language: CollectionLanguage.DE,
        slug: initial.slug,
        title: 'second iteration',
        excerpt: 'once upon a time, the internet...',
        status: CollectionStatus.DRAFT,
      };

      // should return the updated info
      const { data } = await server.executeOperation({
        query: UPDATE_COLLECTION,
        variables: {
          data: input,
        },
      });

      expect(data.updateCollection.stories[0].authors).to.equal(
        sortCollectionStoryAuthors(data.updateCollection.stories[0].authors)
      );
    });

    it('should update publishedAt when going to published status', async () => {
      const input: UpdateCollectionInput = {
        authorExternalId: author.externalId,
        externalId: initial.externalId,
        language: CollectionLanguage.EN,
        slug: initial.slug,
        status: CollectionStatus.PUBLISHED,
        title: 'second iteration',
        excerpt: 'once upon a time, the internet...',
      };

      // publishedAt should have a value
      const { data } = await server.executeOperation({
        query: UPDATE_COLLECTION,
        variables: {
          data: input,
        },
      });

      expect(data.updateCollection.publishedAt).to.exist;
    });

    it('should not update publishedAt when already published', async () => {
      // update the collection to published
      let input: UpdateCollectionInput = {
        authorExternalId: author.externalId,
        externalId: initial.externalId,
        language: CollectionLanguage.EN,
        slug: initial.slug,
        status: CollectionStatus.PUBLISHED,
        title: 'second iteration',
        excerpt: 'once upon a time, the internet...',
      };

      const { data: dataPublished } = await server.executeOperation({
        query: UPDATE_COLLECTION,
        variables: {
          data: input,
        },
      });

      const published = dataPublished.updateCollection;

      // update the collection title (leaving all other fields the same)
      input = {
        authorExternalId: author.externalId,
        externalId: initial.externalId,
        language: CollectionLanguage.EN,
        slug: initial.slug,
        status: CollectionStatus.PUBLISHED,
        title: 'third iteration',
        excerpt: 'once upon a time, the internet...',
      };

      const { data: dataUpdated } = await server.executeOperation({
        query: UPDATE_COLLECTION,
        variables: {
          data: input,
        },
      });

      // make sure the publishedAt value hasn't changed
      expect(published.publishedAt).to.deep.equal(
        dataUpdated.updateCollection.publishedAt
      );
    });

    it('should fail on a duplicate slug', async () => {
      // this should create a slug of 'let-us-go-bowling'
      const secondCollection = await createCollectionHelper(db, {
        title: 'let us go bowling',
        author,
      });

      // try to update the second collection with the same slug as the first
      const input: UpdateCollectionInput = {
        authorExternalId: author.externalId,
        externalId: secondCollection.externalId,
        language: CollectionLanguage.EN,
        slug: initial.slug,
        title: secondCollection.title,
        excerpt: 'once upon a time, the internet...',
        status: CollectionStatus.DRAFT,
      };

      const data = await server.executeOperation({
        query: UPDATE_COLLECTION,
        variables: {
          data: input,
        },
      });

      expect(data.data).not.to.exist;
      expect(data.errors).to.exist;
      expect(data.errors[0].message).to.equal(
        'A collection with the slug "first-iteration" already exists'
      );
    });
  });

  describe('updateCollectionImageUrl', () => {
    let initial: Collection;

    beforeEach(async () => {
      initial = await createCollectionHelper(db, {
        title: 'first iteration',
        author,
      });
    });

    it('should update a collection image url and no other fields', async () => {
      const randomKitten = 'https://placekitten.com/g/200/300';

      const input: UpdateCollectionImageUrlInput = {
        externalId: initial.externalId,
        imageUrl: randomKitten,
      };

      const { data } = await server.executeOperation({
        query: UPDATE_COLLECTION_IMAGE_URL,
        variables: {
          data: input,
        },
      });

      // we should have a new image url
      expect(data.updateCollectionImageUrl.imageUrl).to.equal(randomKitten);

      // other data should be as it was previously
      expect(data.updateCollectionImageUrl.title).to.equal(initial.title);
      expect(data.updateCollectionImageUrl.slug).to.equal(initial.slug);
      expect(data.updateCollectionImageUrl.excerpt).to.equal(initial.excerpt);
      expect(data.updateCollectionImageUrl.intro).to.equal(initial.intro);
      expect(data.updateCollectionImageUrl.status).to.equal(initial.status);
    });
  });
});
