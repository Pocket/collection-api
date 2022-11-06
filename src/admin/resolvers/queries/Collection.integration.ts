import { expect } from 'chai';
import { CollectionStatus } from '@prisma/client';
import { db } from '../../../test/admin-server';
import {
  clear as clearDb,
  createAuthorHelper,
  createCollectionHelper,
  createCollectionPartnerAssociationHelper,
  createCurationCategoryHelper,
  createIABCategoryHelper,
  createLabelHelper,
  createCollectionLabelHelper,
  sortCollectionStoryAuthors,
  getServerWithMockedHeaders,
} from '../../../test/helpers';
import { CreateCollectionLabelInput } from '../../../database/types';
import { COLLECTION_CURATOR_FULL } from '../../../shared/constants';
import { GET_COLLECTION, SEARCH_COLLECTIONS } from './sample-queries.gql';
import { v4 as uuidv4 } from 'uuid';

describe('admin queries: Collection', () => {
  const headers = {
    name: 'Test User',
    username: 'test.user@test.com',
    // default to full access - auth tests occur in a separate test file
    groups: `group1,group2,${COLLECTION_CURATOR_FULL}`,
  };

  // note that calling `executeOperation` on this server does not require
  // calling `server.start()`
  const server = getServerWithMockedHeaders(headers);

  let author;
  let curationCategory;
  let IABParentCategory;
  let IABChildCategory;

  beforeAll(async () => {
    await clearDb(db);
  });

  beforeEach(async () => {
    await clearDb(db);
    author = await createAuthorHelper(db, 'walter');
    curationCategory = await createCurationCategoryHelper(db, 'Business');
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

  describe('getCollection', () => {
    it('can get a collection with no stories by external id', async () => {
      const created = await createCollectionHelper(db, {
        title: 'test me',
        author,
        addStories: false,
        curationCategory,
        IABParentCategory,
        IABChildCategory,
      });

      const { data } = await server.executeOperation({
        query: GET_COLLECTION,
        variables: {
          externalId: created.externalId,
        },
      });

      const collection = data?.getCollection;

      expect(collection.title).to.equal('test me');

      // we should return an author
      expect(collection.authors.length).to.be.greaterThan(0);

      // we should return a curation category
      expect(collection.curationCategory).not.to.be.undefined;
      expect(collection.curationCategory.name).to.equal(curationCategory.name);
      expect(collection.curationCategory.slug).to.equal(curationCategory.slug);
      expect(collection.IABParentCategory.name).to.equal(
        IABParentCategory.name
      );
      expect(collection.IABChildCategory.name).to.equal(IABChildCategory.name);

      // the array should be empty (bc we skipped creating stories above)
      expect(collection.stories.length).to.equal(0);

      // there should be no partnership (we didn't set one up)
      expect(collection.partnership).to.be.null;
    });

    it('can get a collection with stories with authors by external id', async () => {
      const created = await createCollectionHelper(db, {
        title: 'test me',
        author,
      });

      const { data } = await server.executeOperation({
        query: GET_COLLECTION,
        variables: {
          externalId: created.externalId,
        },
      });

      const collection = data?.getCollection;

      // stories should have authors
      expect(collection.stories[0].authors.length).to.be.greaterThan(0);
      expect(collection.stories[0].authors[0]).not.to.be.undefined;
    });

    it('can get a collection with story authors sorted correctly', async () => {
      const created = await createCollectionHelper(db, {
        title: 'test me',
        author,
      });

      const { data } = await server.executeOperation({
        query: GET_COLLECTION,
        variables: {
          externalId: created.externalId,
        },
      });

      const collection = data?.getCollection;

      // the default sort returned from prisma should match our expected
      // manual sort
      expect(collection.stories[0].authors).to.equal(
        sortCollectionStoryAuthors(collection.stories[0].authors)
      );
    });

    it('can get consolidated partnership information for a collection', async () => {
      const created = await createCollectionHelper(db, {
        title: 'test me',
        author,
      });

      const association = await createCollectionPartnerAssociationHelper(db, {
        collection: created,
      });

      const { data } = await server.executeOperation({
        query: GET_COLLECTION,
        variables: {
          externalId: created.externalId,
        },
      });

      const collection = data?.getCollection;

      expect(collection.partnership.externalId).to.equal(
        association.externalId
      );
      expect(collection.partnership.type).to.equal(association.type);
    });

    it('returns no data and a NOT_FOUND error if given an invalid externalId', async () => {
      const created = await createCollectionHelper(db, {
        title: 'test me',
        author,
      });

      const result = await server.executeOperation({
        query: GET_COLLECTION,
        variables: {
          externalId: created.externalId + 'type-o',
        },
      });

      expect(result.errors.length).to.equal(1);
      expect(result.errors[0].message).to.equal(
        `Error - Not Found: ${created.externalId}type-o`
      );
      expect(result.errors[0].extensions.code).to.equal('NOT_FOUND');
      expect(result.data.getCollection).not.to.exist;
    });
  });

  describe('searchCollections', () => {
    let author2;
    let fakeLabel;

    beforeEach(async () => {
      // create a second author for variety
      author2 = await createAuthorHelper(db, 'the dude');

      // create a batch of collections to search
      await createCollectionHelper(db, {
        title: 'the dude abides',
        author: author2,
        addStories: false,
      });
      await createCollectionHelper(db, {
        title: 'does the dude abide?',
        author,
        status: CollectionStatus.ARCHIVED,
        addStories: false,
      });
      await createCollectionHelper(db, {
        title: 'your opinion man',
        author: author2,
        status: CollectionStatus.PUBLISHED,
      });
      await createCollectionHelper(db, {
        title: 'finishing my coffee',
        author,
        status: CollectionStatus.PUBLISHED,
      });
      const fakeCollection = await createCollectionHelper(db, {
        title: 'the dude abides man',
        author,
        status: CollectionStatus.PUBLISHED,
      });

      // create label and collection-label association
      fakeLabel = await createLabelHelper(db, 'region-east-africa', 'fakeUser');
      const collectionLabelInputData: CreateCollectionLabelInput = {
        collectionId: fakeCollection.id,
        labelId: fakeLabel.id,
        createdAt: new Date(),
        createdBy: 'fakeUser',
      };
      await createCollectionLabelHelper(db, collectionLabelInputData);
    });

    it('should search by labelExternalIds', async () => {
      const { data } = await server.executeOperation({
        query: SEARCH_COLLECTIONS,
        variables: {
          filters: {
            labelExternalIds: [fakeLabel.externalId],
          },
        },
      });

      const collections = data?.searchCollections?.collections;

      expect(collections.length).to.equal(1);
      expect(collections[0].title).to.equal('the dude abides man');
      expect(collections[0].labels[0].externalId).to.equal(
        fakeLabel.externalId
      );
    });

    it('should search by status', async () => {
      const { data } = await server.executeOperation({
        query: SEARCH_COLLECTIONS,
        variables: {
          filters: {
            status: CollectionStatus.ARCHIVED,
          },
        },
      });

      const collections = data?.searchCollections?.collections;

      expect(collections.length).to.equal(1);
      expect(collections[0].title).to.equal('does the dude abide?');
      expect(collections[0].stories.length).to.equal(0);
    });

    it('should search by author', async () => {
      const { data } = await server.executeOperation({
        query: SEARCH_COLLECTIONS,
        variables: {
          filters: {
            author: 'the dude',
          },
        },
      });

      const collections = data?.searchCollections?.collections;

      expect(collections.length).to.equal(2);

      // sort order is by updatedAt descending
      expect(collections[0].title).to.equal('your opinion man');
      expect(collections[1].title).to.equal('the dude abides');
    });

    it('should search by title', async () => {
      const { data } = await server.executeOperation({
        query: SEARCH_COLLECTIONS,
        variables: {
          filters: {
            title: 'dude',
          },
        },
      });

      const collections = data?.searchCollections?.collections;

      expect(collections.length).to.equal(3);

      // sort order is by updatedAt descending
      expect(collections[0].title).to.equal('the dude abides man');
      expect(collections[1].title).to.equal('does the dude abide?');
      expect(collections[2].title).to.equal('the dude abides');
    });

    it('should search by multiple filters', async () => {
      const { data } = await server.executeOperation({
        query: SEARCH_COLLECTIONS,
        variables: {
          filters: {
            status: CollectionStatus.PUBLISHED,
            author: author.name,
            title: 'coffee',
          },
        },
      });

      const collections = data?.searchCollections?.collections;

      expect(collections.length).to.equal(1);
      expect(collections[0].title).to.equal('finishing my coffee');
    });

    it('should return all associated data - authors, stories, and story authors', async () => {
      const { data } = await server.executeOperation({
        query: SEARCH_COLLECTIONS,
        variables: {
          filters: {
            status: CollectionStatus.PUBLISHED,
          },
        },
      });

      const collections = data?.searchCollections?.collections;

      for (let i = 0; i < collections.length; i++) {
        expect(collections[i].authors.length).to.be.greaterThan(0);
        expect(collections[i].stories.length).to.be.greaterThan(0);

        for (let j = 0; j < collections[i].stories.length; j++) {
          expect(collections[i].stories[j].authors.length).to.be.greaterThan(0);
        }
      }
    });

    it('should respect pagination', async () => {
      // get 1 per page, get page 2 of the results
      // this should result in 3 matches
      const { data } = await server.executeOperation({
        query: SEARCH_COLLECTIONS,
        variables: {
          filters: {
            status: CollectionStatus.PUBLISHED,
          },
          page: 2,
          perPage: 1,
        },
      });

      const collections = data?.searchCollections?.collections;

      // ensure our perPage is respected
      expect(collections.length).to.equal(1);

      // ensure we are getting the second result (page 2)
      expect(collections[0].title).to.equal('finishing my coffee');
    });

    it('can get published collections with story authors sorted correctly', async () => {
      const { data } = await server.executeOperation({
        query: SEARCH_COLLECTIONS,
        variables: {
          filters: {
            status: CollectionStatus.PUBLISHED,
          },
        },
      });

      const collections = data?.searchCollections?.collections;

      // the default sort returned from prisma should match our expected
      // manual sort
      expect(collections[0].stories[0].authors).to.equal(
        sortCollectionStoryAuthors(collections[0].stories[0].authors)
      );
    });
  });
});
