import { db, getServer } from '../';
import { clear as clearDb, createCurationCategoryHelper } from '../../helpers';
import { GET_CURATION_CATEGORIES } from './queries.gql';

describe('queries: CurationCategory', () => {
  const server = getServer();

  beforeAll(async () => {
    await clearDb(db);
    await server.start();
  });

  afterAll(async () => {
    await db.$disconnect();
    await server.stop();
  });

  describe('getCurationCategories query', () => {
    beforeAll(async () => {
      // Create some curation categories
      await createCurationCategoryHelper(db, 'Technology');
      await createCurationCategoryHelper(db, 'Business');
      await createCurationCategoryHelper(db, 'Food and Drink');
      await createCurationCategoryHelper(db, 'Climate Change');
    });

    it('should get curation categories in alphabetical order', async () => {
      const {
        data: { getCurationCategories: data },
      } = await server.executeOperation({
        query: GET_CURATION_CATEGORIES,
      });

      expect(data[0].name).toEqual('Business');
      expect(data[1].name).toEqual('Climate Change');
      expect(data[2].name).toEqual('Food and Drink');
      expect(data[3].name).toEqual('Technology');
    });

    it('should get all available properties of curation categories', async () => {
      const {
        data: { getCurationCategories: data },
      } = await server.executeOperation({
        query: GET_CURATION_CATEGORIES,
      });

      expect(data[0].externalId).toBeTruthy();
      expect(data[0].name).toBeTruthy();
      expect(data[0].slug).toBeTruthy();
    });
  });
});
