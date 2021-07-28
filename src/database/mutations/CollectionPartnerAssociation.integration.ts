import { CollectionPartnershipType, PrismaClient } from '@prisma/client';
import {
  clear as clearDb,
  createCollectionPartnerAssociationHelper,
  createPartnerHelper,
} from '../../test/helpers';
import {
  UpdateCollectionPartnerAssociationImageUrlInput,
  UpdateCollectionPartnerAssociationInput,
} from '../types';
import {
  deleteCollectionPartnerAssociation,
  updateCollectionPartnerAssociation,
  updateCollectionPartnerAssociationImageUrl,
} from '../mutations';
import { getCollectionPartnerAssociation } from '../queries';

const db = new PrismaClient();

describe('mutations: CollectionPartnerAssociation', () => {
  beforeEach(async () => {
    await clearDb(db);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe('createCollectionPartnerAssociation', () => {
    it('should create a collection partner association with default partner data', async () => {
      const association = await createCollectionPartnerAssociationHelper(db, {
        type: CollectionPartnershipType.PARTNERED,
      });

      // All the optional fields should be empty
      expect(association.name).toBeNull();
      expect(association.url).toBeNull();
      expect(association.blurb).toBeNull();
      expect(association.imageUrl).toBeNull();

      // There should be a type set
      expect(association.type).toEqual(CollectionPartnershipType.PARTNERED);

      // There should be a linked partner
      expect(association.partner.externalId).toBeTruthy();
      expect(association.partner.name).toBeTruthy();
    });

    it('should create a collection partner association with customized partner data', async () => {
      const inputParams = {
        type: CollectionPartnershipType.PARTNERED,
        name: 'A Slightly Tweaked Partner Name',
        url: 'https://www.example.com/',
        imageUrl: 'https://www.example.com/image.jpg',
        blurb: 'This blurb is different from the original blurb',
      };

      const association = await createCollectionPartnerAssociationHelper(
        db,
        inputParams
      );

      // There should be a type set
      expect(association.type).toEqual(CollectionPartnershipType.PARTNERED);

      // All the optional fields should match our inputs
      expect(association.name).toEqual(inputParams.name);
      expect(association.url).toEqual(inputParams.url);
      expect(association.blurb).toEqual(inputParams.blurb);
      expect(association.imageUrl).toEqual(inputParams.imageUrl);

      // There should be a linked partner
      expect(association.partner.externalId).toBeTruthy();
      expect(association.partner.name).toBeTruthy();
    });
  });

  describe('updateCollectionPartnerAssociation', () => {
    it('should update a collection partner association', async () => {
      const association = await createCollectionPartnerAssociationHelper(db, {
        name: 'Anything',
        type: CollectionPartnershipType.SPONSORED,
      });

      const data: UpdateCollectionPartnerAssociationInput = {
        externalId: association.externalId,
        type: CollectionPartnershipType.PARTNERED,
        name: 'Podcast Kings',
        url: 'https://test.com',
        blurb: 'What else is there to talk on a podcast about? Only kittens',
        imageUrl: 'https://i.imgur.com/b0O3wZo.jpg',
        partnerExternalId: association.partner.externalId,
      };

      const updated = await updateCollectionPartnerAssociation(db, data);

      expect(updated.type).toEqual(data.type);
      expect(updated.name).toEqual(data.name);
      expect(updated.url).toEqual(data.url);
      expect(updated.blurb).toEqual(data.blurb);
      expect(updated.imageUrl).toEqual(data.imageUrl);
    });

    it('should update to a different collection partner', async () => {
      const association = await createCollectionPartnerAssociationHelper(db, {
        name: 'Anything',
        type: CollectionPartnershipType.SPONSORED,
      });

      const newPartner = await createPartnerHelper(db);

      const data: UpdateCollectionPartnerAssociationInput = {
        externalId: association.externalId,
        type: association.type,
        name: association.name,
        url: association.url,
        blurb: association.blurb,
        imageUrl: association.imageUrl,
        partnerExternalId: newPartner.externalId,
      };

      const updated = await updateCollectionPartnerAssociation(db, data);

      expect(updated.partner).toEqual(newPartner);
    });
  });

  describe('updateCollectionPartnerAssociationImageUrl', () => {
    it('should update a collection-partner association image url', async () => {
      const association = await createCollectionPartnerAssociationHelper(db, {
        name: 'High Performance Rain',
      });
      const randomKitten = 'https://placekitten.com/g/200/300';

      const data: UpdateCollectionPartnerAssociationImageUrlInput = {
        externalId: association.externalId,
        imageUrl: randomKitten,
      };

      const updated = await updateCollectionPartnerAssociationImageUrl(
        db,
        data
      );

      expect(updated.imageUrl).toEqual(data.imageUrl);
    });

    it('should not update any other association fields', async () => {
      const association = await createCollectionPartnerAssociationHelper(db, {
        name: 'High Performance Rain',
        url: 'https://www.example.com',
        blurb: 'Bringing the highest quality rain to your backyard.',
      });
      const randomKitten = 'https://placekitten.com/g/200/300';

      const data: UpdateCollectionPartnerAssociationImageUrlInput = {
        externalId: association.externalId,
        imageUrl: randomKitten,
      };

      const updated = await updateCollectionPartnerAssociationImageUrl(
        db,
        data
      );

      expect(updated.name).toEqual(association.name);
      expect(updated.url).toEqual(association.url);
      expect(updated.blurb).toEqual(association.blurb);
    });
  });

  describe('deleteCollectionPartnerAssociation', () => {
    let association;

    beforeEach(async () => {
      association = await createCollectionPartnerAssociationHelper(db, {
        type: CollectionPartnershipType.PARTNERED,
      });
    });

    it('should delete a collection partner association and return deleted data', async () => {
      const deleted = await deleteCollectionPartnerAssociation(
        db,
        association.externalId
      );

      expect(deleted.type).toEqual(association.type);
      expect(deleted.partnerId).toEqual(association.partner.id);
      expect(deleted.collectionId).toEqual(association.collection.id);

      // make sure the association is really gone
      const found = await getCollectionPartnerAssociation(
        db,
        association.externalId
      );
      expect(found).toBeFalsy();
    });

    it('should fail to delete a collection partner association if the externalId cannot be found', async () => {
      await expect(
        deleteCollectionPartnerAssociation(db, association.externalId + 'typo')
      ).rejects.toThrow();
    });
  });
});
