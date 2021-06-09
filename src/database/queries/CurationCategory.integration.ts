import { PrismaClient } from '@prisma/client';
import {
  countCurationCategories,
  getCurationCategories,
} from './CurationCategory';
import {
  clear as clearDb,
  createCurationCategoryHelper,
} from '../../test/helpers';

const db = new PrismaClient();

describe('queries: CurationCategory', () => {
  beforeEach(async () => {
    await clearDb(db);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe('getCurationCategories', () => {
    it('should get all curation categories and respect ordering', async () => {
      // create some curation categories to retrieve
      await createCurationCategoryHelper(db, {
        name: 'Endless Articles',
        slug: 'endless-articles',
      });
      await createCurationCategoryHelper(db, {
        name: 'To Read About',
        slug: 'to-read-about',
      });
      await createCurationCategoryHelper(db, {
        name: 'While The World',
        slug: 'while-the-world',
      });
      await createCurationCategoryHelper(db, {
        name: 'Is Standing Still',
        slug: 'is-standing-still',
      });
      await createCurationCategoryHelper(db, {
        name: 'Thanks To A Virus',
        slug: 'thanks-to-a-virus',
      });

      const results = await getCurationCategories(db);

      expect(results.length).toEqual(5);
      expect(results[0].name).toEqual('Endless Articles');
      expect(results[1].name).toEqual('Is Standing Still');
    });
  });

  describe('countCurationCategories', () => {
    it('should accurately count curation categories in the system', async () => {
      // create some curation categories
      await createCurationCategoryHelper(db, {
        name: 'Endless Articles',
        slug: 'endless-articles',
      });
      await createCurationCategoryHelper(db, {
        name: 'To Read About',
        slug: 'to-read-about',
      });
      await createCurationCategoryHelper(db, {
        name: 'While The World',
        slug: 'while-the-world',
      });
      await createCurationCategoryHelper(db, {
        name: 'Is Standing Still',
        slug: 'is-standing-still',
      });
      await createCurationCategoryHelper(db, {
        name: 'Thanks To A Virus',
        slug: 'thanks-to-a-virus',
      });

      const result = await countCurationCategories(db);

      expect(result).toEqual(5);
    });
  });
});
