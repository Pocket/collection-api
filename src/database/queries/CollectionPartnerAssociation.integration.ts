import { CollectionPartnershipType, PrismaClient } from '@prisma/client';
import { getCollectionPartnerAssociation } from './CollectionPartnerAssociation';
import {
  clear as clearDb,
  createCollectionPartnerAssociationHelper,
} from '../../test/helpers';

const db = new PrismaClient();

describe('queries: CollectionPartnerAssociation', () => {
  beforeEach(async () => {
    await clearDb(db);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe('getCollectionPartnerAssociation', () => {
    it('should get an association by its externalId', async () => {
      const association = await createCollectionPartnerAssociationHelper(db, {
        type: CollectionPartnershipType.PARTNERED,
      });

      const found = await getCollectionPartnerAssociation(
        db,
        association.externalId
      );

      expect(found).not.toBeNull();
    });

    it('should fail on an invalid externalId', async () => {
      const association = await createCollectionPartnerAssociationHelper(db, {
        type: CollectionPartnershipType.PARTNERED,
      });

      const found = await getCollectionPartnerAssociation(
        db,
        association.externalId + 'typo'
      );

      expect(found).toBeNull();
    });
  });
});
