import { PrismaClient } from '@prisma/client';
import { countPartners, getPartner, getPartners } from './CollectionPartner';
import { clear as clearDb, createPartnerHelper } from '../../test/helpers';

const db = new PrismaClient();

describe('queries: CollectionPartner', () => {
  beforeEach(async () => {
    await clearDb(db);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe('getPartner', () => {
    it('should get a partner by their externalId', async () => {
      const partner = await createPartnerHelper(db);

      const found = await getPartner(db, partner.externalId);

      expect(found).not.toBeNull();
    });

    it('should fail on an invalid externalId', async () => {
      const partner = await createPartnerHelper(db);

      const found = await getPartner(db, partner.externalId + 'typo');

      expect(found).toBeNull();
    });
  });

  describe('getPartners', () => {
    it('should get partners and respect paging', async () => {
      // create some partners to retrieve
      await createPartnerHelper(db, 'Podcast Kings');
      await createPartnerHelper(db, 'Cloud Podcast');
      await createPartnerHelper(db, 'Podcast Beyond');
      await createPartnerHelper(db, 'Citizen Podcast');
      await createPartnerHelper(db, 'Podcast Authority');

      // get page 2, with 2 per page
      const results = await getPartners(db, 2, 2);

      // as we order by name ascending, this should give us citizen & cloud
      expect(results.length).toEqual(2);
      expect(results[0].name).toEqual('Citizen Podcast');
      expect(results[1].name).toEqual('Cloud Podcast');
    });
  });

  describe('countPartners', () => {
    it('should accurately count collection partners in the system', async () => {
      // create some authors
      await createPartnerHelper(db);
      await createPartnerHelper(db);
      await createPartnerHelper(db);
      await createPartnerHelper(db);
      await createPartnerHelper(db);

      const result = await countPartners(db);

      expect(result).toEqual(5);
    });
  });
});
