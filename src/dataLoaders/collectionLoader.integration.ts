import { expect } from 'chai';
import { PrismaClient, CollectionStatus, Label } from '@prisma/client';
import { getCollectionsBySlugs } from '../database/queries/Collection';
import {
  clear as clearDb,
  createAuthorHelper,
  createCollectionHelper,
  createCollectionLabelHelper,
  createIABCategoryHelper,
  createLabelHelper,
  sortCollectionStoryAuthors,
} from '../test/helpers';
import { CreateCollectionLabelInput } from '../database/types';

const db = new PrismaClient();

describe('queries: Collection', () => {
  let author;
  let IABParentCategory;
  let IABChildCategory;
  let label: Label;

  beforeEach(async () => {
    await clearDb(db);
    author = await createAuthorHelper(db, 'walter');
    IABParentCategory = await createIABCategoryHelper(db, 'Entertainment');
    IABChildCategory = await createIABCategoryHelper(
      db,
      'Bowling',
      IABParentCategory
    );
    label = await createLabelHelper(db, 'test-label', 'test-user');
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe('getCollectionsBySlugs', () => {
    it('can get collections by slugs', async () => {
      await createCollectionHelper(db, {
        title: 'test me',
        author,
        status: CollectionStatus.PUBLISHED,
      });

      const collection2 = await createCollectionHelper(db, {
        title: 'test me 2',
        author,
        status: CollectionStatus.PUBLISHED,
        IABParentCategory,
        IABChildCategory,
      });

      // add a label to the second test collection
      const collection2LabelInput: CreateCollectionLabelInput = {
        collectionId: collection2.id,
        labelId: label.id,
        createdAt: new Date(),
        createdBy: 'test-user',
      };
      await createCollectionLabelHelper(db, collection2LabelInput);

      const collections = await getCollectionsBySlugs(db, [
        'test-me',
        'test-me-2',
      ]);

      expect(collections[0].title).to.equal('test me');
      expect(collections[1].title).to.equal('test me 2');
      expect(collections[0].authors).to.exist;
      expect(collections[1].authors).to.exist;
      expect(collections[0].stories).to.exist;
      expect(collections[0].stories[0].authors.length).to.be.greaterThan(0);
      expect(collections[0].stories[0].authors[0]).to.exist;
      expect(collections[1].stories).to.exist;
      expect(collections[0].stories[1].authors.length).to.be.greaterThan(0);
      expect(collections[1].IABParentCategory.name).to.equal(
        IABParentCategory.name
      );
      expect(collections[1].IABChildCategory.name).to.equal(
        IABChildCategory.name
      );

      // Not much to go on given we're testing a database resolver here
      expect(collections[1].labels).to.have.lengthOf(1);

      // It's a database-level resolver so there's not much to go on.
      // Let's make sure it connects to the right label - the GraphQL-level
      // resolvers will do the rest.
      expect(collections[1].labels[0].labelId).to.equal(label.id);
      expect(collections[1].labels[0].collectionId).to.equal(collection2.id);
    });

    it('gets only published collections', async () => {
      await createCollectionHelper(db, {
        title: 'published 1',
        author,
        status: CollectionStatus.PUBLISHED,
      });
      await createCollectionHelper(db, {
        title: 'published 2',
        author,
        status: CollectionStatus.PUBLISHED,
      });
      await createCollectionHelper(db, {
        title: 'i am le draft',
        author,
      });
      await createCollectionHelper(db, {
        title: 'look at me i am archived',
        author,
        status: CollectionStatus.ARCHIVED,
      });

      const collections = await getCollectionsBySlugs(db, [
        'published-1',
        'i-am-le-draft',
      ]);

      expect(collections.length).to.equal(1);
      expect(collections[0].title).to.equal('published 1');
    });

    it('can get collections by slugs with story authors sorted correctly', async () => {
      await createCollectionHelper(db, {
        title: 'test me',
        author,
        status: CollectionStatus.PUBLISHED,
      });
      await createCollectionHelper(db, {
        title: 'test me 2',
        author,
        status: CollectionStatus.PUBLISHED,
      });

      const collections = await getCollectionsBySlugs(db, [
        'test-me',
        'test-me-2',
      ]);

      // the default sort returned from prisma should match our expected
      // manual sort
      expect(collections[0].stories[0].authors).to.equal(
        sortCollectionStoryAuthors(collections[0].stories[0].authors)
      );
    });
  });
});
