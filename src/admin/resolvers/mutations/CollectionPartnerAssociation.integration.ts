import { expect } from 'chai';
import {
  Collection,
  CollectionAuthor,
  CollectionPartner,
  CollectionPartnershipType,
} from '@prisma/client';
import {
  clear as clearDb,
  createAuthorHelper,
  createCollectionHelper,
  createCollectionPartnerAssociationHelper,
  createPartnerHelper,
  getServerWithMockedHeaders,
} from '../../../test/helpers';
import { db } from '../../../test/admin-server';
import { getCollectionPartnerAssociation } from '../../../database/queries/CollectionPartnerAssociation';
import { deleteCollectionPartnerAssociation } from '../../../database/mutations/CollectionPartnerAssociation';
import {
  CreateCollectionPartnerAssociationInput,
  UpdateCollectionPartnerAssociationInput,
  UpdateCollectionPartnerAssociationImageUrlInput,
} from '../../../database/types';
import { COLLECTION_CURATOR_FULL } from '../../../shared/constants';
import {
  CREATE_COLLECTION_PARTNER_ASSOCIATION,
  DELETE_COLLECTION_PARTNER_ASSOCIATION,
  UPDATE_COLLECTION_PARTNER_ASSOCIATION,
  UPDATE_COLLECTION_PARTNER_ASSOCIATION_IMAGE_URL,
} from './sample-mutations.gql';

describe('mutations: CollectionPartnerAssociation', () => {
  const headers = {
    name: 'Test User',
    username: 'test.user@test.com',
    groups: `group1,group2,${COLLECTION_CURATOR_FULL}`,
  };

  const server = getServerWithMockedHeaders(headers);

  beforeEach(async () => {
    await clearDb(db);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe('createCollectionPartnerAssociation', () => {
    let author: CollectionAuthor;
    let collection: Collection;
    let partner: CollectionPartner;

    beforeEach(async () => {
      author = await createAuthorHelper(db, 'amethyst');
      partner = await createPartnerHelper(db, 'crystal gems');

      collection = await createCollectionHelper(db, {
        title: 'cartoons for adults',
        author,
      });
    });
    it('should create a collection partner association with default partner data', async () => {
      const input: CreateCollectionPartnerAssociationInput = {
        partnerExternalId: partner.externalId,
        collectionExternalId: collection.externalId,
        type: CollectionPartnershipType.PARTNERED,
      };

      const { data } = await server.executeOperation({
        query: CREATE_COLLECTION_PARTNER_ASSOCIATION,
        variables: { data: input },
      });

      // All the optional fields should be empty
      expect(data.createCollectionPartnerAssociation.name).not.to.exist;
      expect(data.createCollectionPartnerAssociation.url).not.to.exist;
      expect(data.createCollectionPartnerAssociation.blurb).not.to.exist;
      expect(data.createCollectionPartnerAssociation.imageUrl).not.to.exist;

      // There should be a type set
      expect(data.createCollectionPartnerAssociation.type).to.equal(
        CollectionPartnershipType.PARTNERED
      );

      // There should be a linked partner
      expect(
        data.createCollectionPartnerAssociation.partner.externalId
      ).to.equal(partner.externalId);
      expect(data.createCollectionPartnerAssociation.partner.name).to.equal(
        partner.name
      );
    });

    it('should create a collection partner association with customized partner data', async () => {
      const input: CreateCollectionPartnerAssociationInput = {
        partnerExternalId: partner.externalId,
        collectionExternalId: collection.externalId,
        type: CollectionPartnershipType.PARTNERED,
        name: 'A Slightly Tweaked Partner Name',
        url: 'https://www.example.com/',
        imageUrl: 'https://www.example.com/image.jpg',
        blurb: 'This blurb is different from the original blurb',
      };

      const { data } = await server.executeOperation({
        query: CREATE_COLLECTION_PARTNER_ASSOCIATION,
        variables: { data: input },
      });

      // There should be a type set
      expect(data.createCollectionPartnerAssociation.type).to.equal(
        CollectionPartnershipType.PARTNERED
      );

      // All the optional fields should match our inputs
      expect(data.createCollectionPartnerAssociation.name).to.equal(input.name);
      expect(data.createCollectionPartnerAssociation.url).to.equal(input.url);
      expect(data.createCollectionPartnerAssociation.blurb).to.equal(
        input.blurb
      );
      expect(data.createCollectionPartnerAssociation.imageUrl).to.equal(
        input.imageUrl
      );

      // There should be a linked partner
      expect(
        data.createCollectionPartnerAssociation.partner.externalId
      ).to.equal(partner.externalId);
      expect(data.createCollectionPartnerAssociation.partner.name).to.equal(
        partner.name
      );
    });
  });

  describe('updateCollectionPartnerAssociation', () => {
    it('should update a collection partner association', async () => {
      const association = await createCollectionPartnerAssociationHelper(db, {
        name: 'Anything',
        type: CollectionPartnershipType.SPONSORED,
      });

      const input: UpdateCollectionPartnerAssociationInput = {
        externalId: association.externalId,
        type: CollectionPartnershipType.PARTNERED,
        name: 'Podcast Kings',
        url: 'https://test.com',
        blurb: 'What else is there to talk on a podcast about? Only kittens',
        imageUrl: 'https://i.imgur.com/b0O3wZo.jpg',
        partnerExternalId: association.partner.externalId,
      };

      const { data } = await server.executeOperation({
        query: UPDATE_COLLECTION_PARTNER_ASSOCIATION,
        variables: { data: input },
      });

      expect(data.updateCollectionPartnerAssociation.type).to.equal(input.type);
      expect(data.updateCollectionPartnerAssociation.name).to.equal(input.name);
      expect(data.updateCollectionPartnerAssociation.url).to.equal(input.url);
      expect(data.updateCollectionPartnerAssociation.blurb).to.equal(
        input.blurb
      );
      expect(data.updateCollectionPartnerAssociation.imageUrl).to.equal(
        input.imageUrl
      );
    });

    it('should update to a different collection partner', async () => {
      const association = await createCollectionPartnerAssociationHelper(db, {
        name: 'Anything',
        type: CollectionPartnershipType.SPONSORED,
      });

      const newPartner = await createPartnerHelper(db);

      const input: UpdateCollectionPartnerAssociationInput = {
        externalId: association.externalId,
        type: association.type,
        name: association.name,
        url: association.url,
        blurb: association.blurb,
        imageUrl: association.imageUrl,
        partnerExternalId: newPartner.externalId,
      };

      const { data } = await server.executeOperation({
        query: UPDATE_COLLECTION_PARTNER_ASSOCIATION,
        variables: { data: input },
      });

      // the internal id is not returned via the API
      delete newPartner.id;

      expect(data.updateCollectionPartnerAssociation.partner).to.deep.equal({
        ...newPartner,
        image: { url: association.imageUrl },
      });
    });
  });

  describe('updateCollectionPartnerAssociationImageUrl', () => {
    it('should update a collection-partner association image url', async () => {
      const association = await createCollectionPartnerAssociationHelper(db, {
        name: 'High Performance Rain',
      });
      const randomKitten = 'https://placekitten.com/g/200/300';

      const input: UpdateCollectionPartnerAssociationImageUrlInput = {
        externalId: association.externalId,
        imageUrl: randomKitten,
      };

      const { data } = await server.executeOperation({
        query: UPDATE_COLLECTION_PARTNER_ASSOCIATION_IMAGE_URL,
        variables: { data: input },
      });

      expect(data.updateCollectionPartnerAssociationImageUrl.imageUrl).to.equal(
        input.imageUrl
      );
    });

    it('should not update any other association fields', async () => {
      const association = await createCollectionPartnerAssociationHelper(db, {
        name: 'High Performance Rain',
        url: 'https://www.example.com',
        blurb: 'Bringing the highest quality rain to your backyard.',
      });
      const randomKitten = 'https://placekitten.com/g/200/300';

      const input: UpdateCollectionPartnerAssociationImageUrlInput = {
        externalId: association.externalId,
        imageUrl: randomKitten,
      };

      const { data } = await server.executeOperation({
        query: UPDATE_COLLECTION_PARTNER_ASSOCIATION_IMAGE_URL,
        variables: { data: input },
      });

      expect(data.updateCollectionPartnerAssociationImageUrl.name).to.equal(
        association.name
      );
      expect(data.updateCollectionPartnerAssociationImageUrl.url).to.equal(
        association.url
      );
      expect(data.updateCollectionPartnerAssociationImageUrl.blurb).to.equal(
        association.blurb
      );
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
      const { data } = await server.executeOperation({
        query: DELETE_COLLECTION_PARTNER_ASSOCIATION,
        variables: { externalId: association.externalId },
      });

      expect(data.deleteCollectionPartnerAssociation.type).to.equal(
        association.type
      );

      expect(
        data.deleteCollectionPartnerAssociation.partner.externalId
      ).to.equal(association.partner.externalId);

      expect(data.deleteCollectionPartnerAssociation.name).to.equal(
        association.name
      );

      // make sure the association is really gone
      const found = await getCollectionPartnerAssociation(
        db,
        association.externalId
      );

      expect(found).not.to.exist;
    });

    it('should fail to delete a collection partner association if the externalId cannot be found', async () => {
      const data = await server.executeOperation({
        query: DELETE_COLLECTION_PARTNER_ASSOCIATION,
        variables: { externalId: association.externalId + 'typo' },
      });

      expect(data.errors.length).to.equal(1);
      expect(data.errors[0].message).to.equal(
        `Cannot delete a collection partner association with external ID "${association.externalId}typo"`
      );
    });

    // this is testing internal db logic - so we don't need to go through the API
    it("should update related stories' sponsorship status", async () => {
      const deleted = await deleteCollectionPartnerAssociation(
        db,
        association.externalId
      );

      // check that none of the related collection stories have 'fromPartner'
      // set to true
      const sponsoredStories = await db.collectionStory.findMany({
        where: {
          collectionId: deleted.collectionId,
          fromPartner: true,
        },
      });

      expect(sponsoredStories.length).to.equal(0);
    });
  });
});
