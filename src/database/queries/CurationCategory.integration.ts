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
    it('should get curation categories and respect paging', async () => {
      // create some curation categories to retrieve
      await createCurationCategoryHelper(db, 'Endless Articles');
      await createCurationCategoryHelper(db, 'To Read About');
      await createCurationCategoryHelper(db, 'While The World');
      await createCurationCategoryHelper(db, 'Is Standing Still');
      await createCurationCategoryHelper(db, 'Thanks To A Virus');

      // get page 2, with 2 per page
      const results = await getCurationCategories(db, 2, 2);

      // as we order by name ascending, this should give us "Thanks.." and "To..."
      expect(results.length).toEqual(2);
      expect(results[0].name).toEqual('Thanks To A Virus');
      expect(results[1].name).toEqual('To Read About');
    });
  });

  describe('countCurationCategories', () => {
    it('should accurately count curation categories in the system', async () => {
      // create some curation categories
      await createCurationCategoryHelper(db, 'Endless Articles');
      await createCurationCategoryHelper(db, 'To Read About');
      await createCurationCategoryHelper(db, 'While The World');
      await createCurationCategoryHelper(db, 'Is Standing Still');
      await createCurationCategoryHelper(db, 'Thanks To A Virus');

      const result = await countCurationCategories(db);

      expect(result).toEqual(5);
    });
  });
});
