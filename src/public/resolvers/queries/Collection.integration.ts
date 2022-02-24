import { expect } from 'chai';
import { db, getServer } from '../../../test/public-server';
import {
  clear as clearDb,
  createAuthorHelper,
  createCollectionHelper,
  createCurationCategoryHelper,
  createIABCategoryHelper,
} from '../../../test/helpers';
import { GET_COLLECTIONS } from './sample-queries.gql';
import { CollectionStatus } from '@prisma/client';

describe('public queries: Collection', () => {
  const server = getServer();

  let author;
  let curationCategory;
  let IABParentCategory;
  let IABChildCategory;

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
    it('can get collections', async () => {
      await createCollectionHelper(db, {
        title: 'ways in which my back hurts',
        author,
        addStories: false,
        curationCategory,
        IABParentCategory,
        IABChildCategory,
        status: CollectionStatus.PUBLISHED,
      });

      await createCollectionHelper(db, {
        title: 'best songs of 2006',
        author,
        addStories: false,
        curationCategory,
        IABParentCategory,
        IABChildCategory,
        status: CollectionStatus.PUBLISHED,
      });

      const result = await server.executeOperation({
        query: GET_COLLECTIONS,
      });

      expect(result.errors).to.be.undefined;
      expect(result.data?.getCollections?.collections.length).to.equal(2);
    });
  });
});
