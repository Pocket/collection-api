import { CollectionPartnershipType, PrismaClient } from '@prisma/client';
// import {
//   CreateCollectionPartnerAssociationInput,
//   UpdateCollectionPartnerAssociationInput,
// } from '../types';
import {
  clear as clearDb,
  createCollectionPartnerAssociationHelper,
} from '../../test/helpers';
import { UpdateCollectionPartnerAssociationInput } from '../types';
import { updateCollectionPartnerAssociation } from './CollectionPartnerAssociation';
// import {
//   createCollectionPartnerAssociation,
//   updateCollectionPartnerAssociation,
//   deleteCollectionPartnerAssociation,
// } from './CollectionPartnerAssociation';

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

      // and a linked collection
      expect(association.collection.externalId).toBeTruthy();
      expect(association.collection.title).toBeTruthy();
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

      // and a linked collection
      expect(association.collection.externalId).toBeTruthy();
      expect(association.collection.title).toBeTruthy();
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
        collectionExternalId: association.collection.externalId,
      };

      const updated = await updateCollectionPartnerAssociation(db, data);

      expect(updated.type).toEqual(data.type);
      expect(updated.name).toEqual(data.name);
      expect(updated.url).toEqual(data.url);
      expect(updated.blurb).toEqual(data.blurb);
      expect(updated.imageUrl).toEqual(data.imageUrl);
    });
  });

  // describe('deleteCollectionPartnerAssociation', () => {
  //   let association;
  //
  //   beforeEach(async () => {
  //     association = await createCollectionPartnerAssociationHelper(db, {
  //       type: CollectionPartnershipType.PARTNERED,
  //     });
  //   });
  //
  //   it('should delete a collection partner association and return deleted data', async () => {
  //     const deleted = await deleteCollectionPartnerAssociation(
  //       db,
  //       association.externalId
  //     );
  //
  //     expect(deleted.type).toEqual(association.type);
  //
  //     expect(deleted.partnerId).toEqual(association.collection.externalId);
  //     expect(deleted.collectionId).toEqual(association.collection.externalId);
  //
  //     // make sure the association is really gone
  //     // const found = await getCollectionPartnerAssociation(db, association.externalId);
  //     // expect(found).toBeFalsy();
  //   });
  //
  //   it('should fail to delete a collection partner association if the externalId cannot be found', async () => {
  //     await expect(
  //       deleteCollectionPartnerAssociation(db, association.externalId + 'typo')
  //     ).rejects.toThrow();
  //   });
  // });
});
