import { PrismaClient } from '@prisma/client';
import { getIABCategories } from './IABCategory';
import { clear as clearDb, createIABCategoryHelper } from '../../test/helpers';

const db = new PrismaClient();

describe('queries: IABCategory', () => {
  beforeEach(async () => {
    await clearDb(db);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe('getIABCategories', () => {
    it('should get all IAB categories with children, all ordered alphabetically by slug', async () => {
      // create some IAB categories to retrieve
      const parent1 = await createIABCategoryHelper(db, 'Arts & Entertainment');
      await createIABCategoryHelper(db, 'Books & Literature', parent1);
      await createIABCategoryHelper(db, 'Celebrity Fan/Gossip', parent1);
      const parent2 = await createIABCategoryHelper(db, 'Automotive');
      await createIABCategoryHelper(db, 'Auto Parts', parent2);

      const results = await getIABCategories(db);

      expect(results.length).toEqual(2);
      expect(results[0].name).toEqual('Arts & Entertainment');
      expect(results[0].externalId).toBeTruthy();
      expect(results[0].slug).toBeTruthy();
      expect(results[0].children.length).toEqual(2);
      expect(results[1].name).toEqual('Automotive');
      expect(results[1].children.length).toEqual(1);
    });
  });
});
