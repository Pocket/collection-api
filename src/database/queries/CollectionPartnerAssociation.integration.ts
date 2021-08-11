import { CollectionPartnershipType, PrismaClient } from '@prisma/client';
import {
  getCollectionPartnerAssociation,
  getCollectionPartnerAssociationForCollection,
} from './CollectionPartnerAssociation';
import {
  clear as clearDb,
  createAuthorHelper,
  createCollectionHelper,
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

  describe('getCollectionPartnerAssociationForCollection', () => {
    it('should get an association by the externalId of the collection it references', async () => {
      const author = await createAuthorHelper(db, 'Any Name');
      const collection = await createCollectionHelper(db, {
        title: 'A test collection',
        author,
      });

      const association = await createCollectionPartnerAssociationHelper(db, {
        type: CollectionPartnershipType.PARTNERED,
        collection,
      });

      const found = await getCollectionPartnerAssociationForCollection(
        db,
        collection.externalId
      );

      expect(found).not.toBeNull();
      expect(association.externalId).toEqual(found.externalId);
    });

    it('should fail on an invalid collection externalId', async () => {
      const author = await createAuthorHelper(db, 'Any Name');
      const collection = await createCollectionHelper(db, {
        title: 'A test collection without a partnership',
        author,
      });

      const found = await getCollectionPartnerAssociationForCollection(
        db,
        collection.externalId
      );

      expect(found).toBeNull();
    });
  });
});
