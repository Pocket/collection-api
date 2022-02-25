import { expect } from 'chai';
import { db, getServer } from '../../../test/admin-server';
import { getCollection } from './Collection';
import {
  clear as clearDb,
  createAuthorHelper,
  createCollectionHelper,
  createCollectionPartnerAssociationHelper,
  createCurationCategoryHelper,
  createIABCategoryHelper,
  sortCollectionStoryAuthors,
} from '../../../test/helpers';
import { GET_COLLECTION } from './sample-queries.gql';

describe('admin queries: Collection', () => {
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

      const collection = await getCollection(db, created.externalId);

      expect(collection.title).to.equal('test me');

      // we should return an author
      expect(collection.authors).toBeTruthy();

      // we should return a curation category
      expect(collection.curationCategory).toBeTruthy();
      expect(collection.curationCategory.name).to.equal(curationCategory.name);
      expect(collection.curationCategory.slug).to.equal(curationCategory.slug);
      expect(collection.IABParentCategory.name).to.equal(
        IABParentCategory.name
      );
      expect(collection.IABChildCategory.name).to.equal(IABChildCategory.name);

      // we should return an array (truthy)
      expect(collection.stories).toBeTruthy();

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

      const collection = await getCollection(db, created.externalId);

      // stories should have authors
      expect(collection.stories[0].authors.length).toBeGreaterThan(0);
      expect(collection.stories[0].authors[0]).toBeTruthy();
    });

    it('can get a collection with story authors sorted correctly', async () => {
      const created = await createCollectionHelper(db, {
        title: 'test me',
        author,
      });

      const collection = await getCollection(db, created.externalId);

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
      const collection = await getCollection(db, created.externalId);

      expect(collection.partnership.externalId).to.equal(
        association.externalId
      );
      expect(collection.partnership.type).to.equal(association.type);
    });
  });
});
