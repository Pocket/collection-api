import { expect } from 'chai';
import { db, getServer } from '../../../test/public-server';
import { CollectionLanguage } from '../../../database/types';
import {
  clear as clearDb,
  createAuthorHelper,
  createCollectionHelper,
  createCurationCategoryHelper,
  createIABCategoryHelper,
  sortCollectionStoryAuthors,
} from '../../../test/helpers';
import {
  COLLECTION_BY_SLUG,
  GET_COLLECTIONS,
  GET_COLLECTION_BY_SLUG,
  COLLECTION_ITEM_REFERENCE_RESOLVER,
} from './sample-queries.gql';
import {
  CollectionAuthor,
  CollectionStatus,
  CurationCategory,
  IABCategory,
} from '@prisma/client';

describe('public queries: Collection', () => {
  const server = getServer();

  let author: CollectionAuthor;
  let curationCategory: CurationCategory;
  let IABParentCategory: IABCategory;
  let IABChildCategory: IABCategory;

  beforeAll(async () => {
    await clearDb(db);
    await server.start();
  });

  beforeEach(async () => {
    await clearDb(db);

    // set up some default entities to use when creating collections in each test
    // needs to be in `beforeEach` because we clear the db above - may refactor
    // for better efficiency as more tests are added
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
    await server.stop();
  });

  describe('getCollections', () => {
    it('should get collections and all associated data', async () => {
      await createCollectionHelper(db, {
        title: 'ways in which my back hurts',
        author,
        addStories: true,
        curationCategory,
        IABParentCategory,
        IABChildCategory,
        status: CollectionStatus.PUBLISHED,
      });

      await createCollectionHelper(db, {
        title: 'best songs of 2006',
        author,
        addStories: true,
        curationCategory,
        IABParentCategory,
        IABChildCategory,
        status: CollectionStatus.PUBLISHED,
      });

      const { data } = await server.executeOperation({
        query: GET_COLLECTIONS,
      });

      const collections = data?.getCollections?.collections;

      expect(collections.length).to.equal(2);

      for (let i = 0; i < collections.length; i++) {
        expect(collections[i].title).not.to.be.empty;
        expect(collections[i].authors.length).to.equal(1);
        expect(collections[i].stories.length).to.be.greaterThan(0);
        expect(collections[i].curationCategory.name).to.equal(
          curationCategory.name
        );
        expect(collections[i].stories[0].authors).not.to.be.empty;
        expect(collections[i].IABParentCategory.name).to.equal(
          IABParentCategory.name
        );
        expect(collections[i].IABChildCategory.name).to.equal(
          IABChildCategory.name
        );
      }
      // ensure we are getting all client data
    });

    it('should get only published collections', async () => {
      await createCollectionHelper(db, {
        title: 'first',
        author,
        status: CollectionStatus.PUBLISHED,
        IABParentCategory,
        IABChildCategory,
        addStories: true,
      });
      await createCollectionHelper(db, {
        title: 'second',
        author,
        status: CollectionStatus.DRAFT,
      });
      await createCollectionHelper(db, {
        title: 'third',
        author,
        status: CollectionStatus.ARCHIVED,
      });
      await createCollectionHelper(db, {
        title: 'fourth',
        author,
        status: CollectionStatus.PUBLISHED,
        IABParentCategory,
        IABChildCategory,
        addStories: true,
      });

      const { data } = await server.executeOperation({
        query: GET_COLLECTIONS,
      });

      // only two collections above are published
      expect(data?.getCollections.collections.length).to.equal(2);
    });

    it('should respect pagination', async () => {
      // default sort is by `publishedAt` descending, so
      // these should be returned bottom to top
      await createCollectionHelper(db, {
        title: '1',
        author,
        status: CollectionStatus.PUBLISHED,
        publishedAt: new Date(2021, 0, 1),
      });
      await createCollectionHelper(db, {
        title: '2',
        author,
        status: CollectionStatus.PUBLISHED,
        publishedAt: new Date(2021, 0, 2),
      });
      await createCollectionHelper(db, {
        title: '3',
        author,
        status: CollectionStatus.PUBLISHED,
        publishedAt: new Date(2021, 0, 3),
      });
      await createCollectionHelper(db, {
        title: '4',
        author,
        status: CollectionStatus.PUBLISHED,
        publishedAt: new Date(2021, 0, 4),
      });
      await createCollectionHelper(db, {
        title: '5',
        author,
        status: CollectionStatus.PUBLISHED,
        publishedAt: new Date(2021, 0, 5),
      });

      // we are getting two collections per page, and are requesting page 2
      // page 1 should be 5 and 4. page 2 should be 3 and 2, page 3 should be 1
      const { data } = await server.executeOperation({
        query: GET_COLLECTIONS,
        variables: {
          perPage: 2,
          page: 2,
        },
      });

      const collections = data?.getCollections?.collections;

      expect(collections.length).to.equal(2);
      expect(collections[0].title).to.equal('3');
      expect(collections[1].title).to.equal('2');

      // verify pagination
      const pagination = data?.getCollections?.pagination;

      // there are 5 total published collections
      expect(pagination.totalResults).to.equal(5);
      // two collections per page, so we should have 3 pages
      expect(pagination.totalPages).to.equal(3);
      // verify the page returned is the one requested
      expect(pagination.currentPage).to.equal(2);
    });

    it('should respect pagination when filtering by language', async () => {
      // default sort is by `publishedAt` descending, so these should be returned bottom to top
      await createCollectionHelper(db, {
        title: '1',
        author,
        status: CollectionStatus.PUBLISHED,
        publishedAt: new Date(2021, 0, 1),
        language: CollectionLanguage.DE,
      });
      await createCollectionHelper(db, {
        title: '2',
        author,
        status: CollectionStatus.PUBLISHED,
        publishedAt: new Date(2021, 0, 2),
        language: CollectionLanguage.DE,
      });
      await createCollectionHelper(db, {
        title: '3',
        author,
        status: CollectionStatus.PUBLISHED,
        publishedAt: new Date(2021, 0, 3),
        language: CollectionLanguage.DE,
      });
      await createCollectionHelper(db, {
        title: '4',
        author,
        status: CollectionStatus.PUBLISHED,
        publishedAt: new Date(2021, 0, 4),
        language: CollectionLanguage.DE,
      });
      await createCollectionHelper(db, {
        title: '5',
        author,
        status: CollectionStatus.PUBLISHED,
        publishedAt: new Date(2021, 0, 5),
        language: CollectionLanguage.EN,
      });
      await createCollectionHelper(db, {
        title: '6',
        author,
        status: CollectionStatus.PUBLISHED,
        publishedAt: new Date(2021, 0, 6),
        language: CollectionLanguage.DE,
      });

      // we are getting two collections per page, and are requesting page 2
      // page 1 should be 6 and 4. page 2 should be 3 and 2, page 3 should be 1
      const { data } = await server.executeOperation({
        query: GET_COLLECTIONS,
        variables: {
          filters: {
            language: 'DE',
          },
          page: 2,
          perPage: 2,
        },
      });

      const collections = data?.getCollections?.collections;

      expect(collections.length).to.equal(2);
      expect(collections[0].title).to.equal('3');
      expect(collections[1].title).to.equal('2');

      // verify pagination
      const pagination = data?.getCollections?.pagination;

      // there are 5 total published collections
      expect(pagination.totalResults).to.equal(5);
      // two collections per page, so we should have 3 pages
      expect(pagination.totalPages).to.equal(3);
      // verify the page returned is the one requested
      expect(pagination.currentPage).to.equal(2);
    });

    it('should get only `EN` published collections if no language is specified', async () => {
      await createCollectionHelper(db, {
        title: 'first',
        author,
        status: CollectionStatus.PUBLISHED,
        language: CollectionLanguage.EN,
      });
      await createCollectionHelper(db, {
        title: 'second',
        author,
        language: CollectionLanguage.EN,
        status: CollectionStatus.DRAFT,
      });
      await createCollectionHelper(db, {
        title: 'third',
        author,
        status: CollectionStatus.ARCHIVED,
        language: CollectionLanguage.EN,
      });
      await createCollectionHelper(db, {
        title: 'fourth',
        author,
        status: CollectionStatus.PUBLISHED,
        language: CollectionLanguage.DE,
      });
      await createCollectionHelper(db, {
        title: 'fifth',
        author,
        status: CollectionStatus.PUBLISHED,
        language: CollectionLanguage.EN,
      });

      const { data } = await server.executeOperation({
        query: GET_COLLECTIONS,
      });

      const collections = data?.getCollections?.collections;

      // only two published collections are in `EN`
      expect(collections.length).to.equal(2);
    });

    it('should get only published collections filtered by language', async () => {
      await createCollectionHelper(db, {
        title: 'first',
        author,
        status: CollectionStatus.PUBLISHED,
        language: CollectionLanguage.DE,
      });
      await createCollectionHelper(db, {
        title: 'second',
        author,
        language: CollectionLanguage.DE,
        status: CollectionStatus.DRAFT,
      });
      await createCollectionHelper(db, {
        title: 'third',
        author,
        status: CollectionStatus.ARCHIVED,
        language: CollectionLanguage.DE,
      });
      await createCollectionHelper(db, {
        title: 'fourth',
        author,
        status: CollectionStatus.PUBLISHED,
        language: CollectionLanguage.EN,
      });
      await createCollectionHelper(db, {
        title: 'fifth',
        author,
        status: CollectionStatus.PUBLISHED,
        language: CollectionLanguage.DE,
      });

      const { data } = await server.executeOperation({
        query: GET_COLLECTIONS,
        variables: {
          filters: {
            language: 'DE',
          },
        },
      });

      const collections = data?.getCollections?.collections;

      expect(collections.length).to.equal(2);
    });

    it('should get only published collections filtered by language in lowercase', async () => {
      await createCollectionHelper(db, {
        title: 'first',
        author,
        status: CollectionStatus.PUBLISHED,
        language: CollectionLanguage.EN,
      });
      await createCollectionHelper(db, {
        title: 'second',
        author,
        language: CollectionLanguage.EN,
      });
      await createCollectionHelper(db, {
        title: 'third',
        author,
        status: CollectionStatus.ARCHIVED,
        language: CollectionLanguage.EN,
      });
      await createCollectionHelper(db, {
        title: 'fourth',
        author,
        status: CollectionStatus.PUBLISHED,
        language: CollectionLanguage.DE,
      });
      await createCollectionHelper(db, {
        title: 'fifth',
        author,
        status: CollectionStatus.PUBLISHED,
        language: CollectionLanguage.EN,
      });

      const { data } = await server.executeOperation({
        query: GET_COLLECTIONS,
        variables: {
          filters: {
            language: 'en',
          },
        },
      });

      const collections = data?.getCollections?.collections;

      expect(collections.length).to.equal(2);
    });

    it('should get only `EN` published collections if an unsupported language is provided', async () => {
      await createCollectionHelper(db, {
        title: 'first',
        author,
        status: CollectionStatus.PUBLISHED,
        language: CollectionLanguage.EN,
      });
      await createCollectionHelper(db, {
        title: 'second',
        author,
        language: CollectionLanguage.EN,
      });
      await createCollectionHelper(db, {
        title: 'third',
        author,
        status: CollectionStatus.ARCHIVED,
        language: CollectionLanguage.EN,
      });
      await createCollectionHelper(db, {
        title: 'fourth',
        author,
        status: CollectionStatus.PUBLISHED,
        language: CollectionLanguage.DE,
      });
      await createCollectionHelper(db, {
        title: 'fifth',
        author,
        status: CollectionStatus.PUBLISHED,
        language: CollectionLanguage.EN,
      });

      const { data } = await server.executeOperation({
        query: GET_COLLECTIONS,
        variables: {
          filters: {
            // XX is not a language code we support
            language: 'XX',
          },
        },
      });

      const collections = data?.getCollections?.collections;

      // there are two `EN` language published collections above
      expect(collections.length).to.equal(2);
    });

    it('should get published collections with story authors sorted correctly', async () => {
      await createCollectionHelper(db, {
        title: 'first',
        author,
        status: CollectionStatus.PUBLISHED,
      });
      await createCollectionHelper(db, {
        title: 'fourth',
        author,
        status: CollectionStatus.PUBLISHED,
      });

      const { data } = await server.executeOperation({
        query: GET_COLLECTIONS,
      });

      const collections = data?.getCollections?.collections;

      // the default sort returned from prisma should match our expected
      // manual sort
      expect(collections[0].stories[0].authors).to.equal(
        sortCollectionStoryAuthors(collections[0].stories[0].authors)
      );
    });
  });

  describe('getCollectionBySlug', () => {
    it('happy path: can get a collection and all associated data by slug', async () => {
      await createCollectionHelper(db, {
        title: 'ultra suede is a miracle',
        author,
        addStories: true,
        curationCategory,
        IABParentCategory,
        IABChildCategory,
        status: CollectionStatus.PUBLISHED,
      });

      const { data } = await server.executeOperation({
        query: GET_COLLECTION_BY_SLUG,
        variables: {
          slug: 'ultra-suede-is-a-miracle',
        },
      });

      const collection = data?.getCollectionBySlug;

      // ensure we are getting all client data
      expect(collection.title).to.equal('ultra suede is a miracle');
      expect(collection.authors.length).to.equal(1);
      expect(collection.stories.length).to.be.greaterThan(0);
      expect(collection.curationCategory.name).to.equal(curationCategory.name);
      expect(collection.stories[0].authors).not.to.be.empty;
      expect(collection.IABParentCategory.name).to.equal(
        IABParentCategory.name
      );
      expect(collection.IABChildCategory.name).to.equal(IABChildCategory.name);
    });

    it('should get a collection that is in REVIEW status', async () => {
      await createCollectionHelper(db, {
        title: 'I am under review',
        author,
        status: CollectionStatus.REVIEW,
        curationCategory,
        IABParentCategory,
        IABChildCategory,
      });

      const { data } = await server.executeOperation({
        query: GET_COLLECTION_BY_SLUG,
        variables: {
          slug: 'i-am-under-review',
        },
      });

      const collection = data?.getCollectionBySlug;

      expect(collection.title).to.equal('I am under review');
    });

    it("should not get a collection that isn't published/under review", async () => {
      await createCollectionHelper(db, {
        title: "writer's block",
        author,
        status: CollectionStatus.DRAFT,
      });

      const { data } = await server.executeOperation({
        query: GET_COLLECTION_BY_SLUG,
        variables: {
          slug: 'writers-block',
        },
      });

      expect(data?.getCollectionBySlug).to.be.null;
    });

    it('can get a collection by slug with getCollectionBySlug with story authors sorted correctly', async () => {
      await createCollectionHelper(db, {
        title: 'why february is sixty days long',
        author,
        status: CollectionStatus.PUBLISHED,
      });

      const { data } = await server.executeOperation({
        query: GET_COLLECTION_BY_SLUG,
        variables: {
          slug: 'why-february-is-sixty-days-long',
        },
      });

      const collection = data?.getCollectionBySlug;

      // the default sort returned from prisma should match our expected
      // manual sort
      expect(collection.stories[0].authors).to.equal(
        sortCollectionStoryAuthors(collection.stories[0].authors)
      );
    });

    it('can get a collection by slug with collectionBySlug with story authors sorted correctly', async () => {
      await createCollectionHelper(db, {
        title: 'why february is sixty days long',
        author,
        status: CollectionStatus.PUBLISHED,
      });

      const { data } = await server.executeOperation({
        query: COLLECTION_BY_SLUG,
        variables: {
          slug: 'why-february-is-sixty-days-long',
        },
      });

      const collection = data?.collectionBySlug;

      // the default sort returned from prisma should match our expected
      // manual sort
      expect(collection.stories[0].authors).to.equal(
        sortCollectionStoryAuthors(collection.stories[0].authors)
      );
    });

    it('should return NOT_FOUND error for an invalid slug', async () => {
      const result = await server.executeOperation({
        query: GET_COLLECTION_BY_SLUG,
        variables: {
          slug: 'this-is-just-good-timing',
        },
      });

      expect(result.data?.getCollectionBySlug).not.to.exist;
      expect(result.errors.length).to.equal(1);
      expect(result.errors[0].message).to.equal(
        `Error - Not Found: this-is-just-good-timing`
      );
      expect(result.errors[0].extensions.code).to.equal('NOT_FOUND');
    });
  });

  describe('Item reference resolver', () => {
    it('should resolve on a collection Item', async () => {
      const collectionItem = await createCollectionHelper(db, {
        title: 'Collection one',
        author,
        language: CollectionLanguage.DE,
        status: CollectionStatus.PUBLISHED,
      });

      const givenUrl = `https://getpocket.com/de/collections/${collectionItem.slug}`;

      const result = await server.executeOperation({
        query: COLLECTION_ITEM_REFERENCE_RESOLVER,
        variables: {
          url: givenUrl,
        },
      });

      expect(result.errors).to.be.undefined;
      expect(result.data._entities.length).to.equal(1);
      expect(result.data._entities[0].givenUrl).to.equal(givenUrl);
      expect(result.data._entities[0].collection.slug).to.equal(
        collectionItem.slug
      );
    });

    it('should not resolve when an Item is not a collection', async () => {
      const givenUrl = `https://getpocket.com/random-test-slug`;

      const result = await server.executeOperation({
        query: COLLECTION_ITEM_REFERENCE_RESOLVER,
        variables: {
          url: givenUrl,
        },
      });

      expect(result.errors).to.be.undefined;
      expect(result.data._entities[0].collection).to.equal(null);
    });
  });
});
