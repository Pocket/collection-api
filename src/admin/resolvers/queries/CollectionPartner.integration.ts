import { expect } from 'chai';
import { faker } from '@faker-js/faker';
import { CollectionPartner, CollectionPartnershipType } from '@prisma/client';
import config from '../../../config';
import { db } from '../../../test/admin-server';
import {
  clear as clearDb,
  createCollectionPartnerAssociationHelper,
  createPartnerHelper,
  getServerWithMockedHeaders,
} from '../../../test/helpers';
import { CreateCollectionPartnerInput } from '../../../database/types';
import {
  GET_COLLECTION_PARTNER,
  GET_COLLECTION_PARTNERS,
  GET_COLLECTION_PARTNER_ASSOCIATION,
} from './sample-queries.gql';
import { COLLECTION_CURATOR_FULL } from '../../../shared/constants';

describe('queries: CollectionPartner', () => {
  const headers = {
    name: 'Test User',
    username: 'test.user@test.com',
    groups: `group1,group2,${COLLECTION_CURATOR_FULL}`,
  };

  const server = getServerWithMockedHeaders(headers);

  beforeAll(async () => {
    await clearDb(db);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe('getCollectionPartners query', () => {
    beforeAll(async () => {
      // Create some partners
      await createPartnerHelper(db, 'True Swag');
      await createPartnerHelper(db, 'Free Range Voiceover');
      await createPartnerHelper(db, 'Wearable Tools');
      await createPartnerHelper(db, 'Your Choice Wearables');
    });

    it('should get partners in alphabetical order', async () => {
      const {
        data: { getCollectionPartners: data },
      } = await server.executeOperation({
        query: GET_COLLECTION_PARTNERS,
        variables: {
          page: 1,
          perPage: 10,
        },
      });

      expect(data.partners[0].name).to.equal('Free Range Voiceover');
      expect(data.partners[1].name).to.equal('True Swag');
      expect(data.partners[2].name).to.equal('Wearable Tools');
      expect(data.partners[3].name).to.equal('Your Choice Wearables');
    });

    it('should get all available properties of collection partners', async () => {
      const {
        data: { getCollectionPartners: data },
      } = await server.executeOperation({
        query: GET_COLLECTION_PARTNERS,
        variables: {
          page: 1,
          perPage: 1,
        },
      });

      expect(data.partners[0].externalId).to.exist;
      expect(data.partners[0].name).to.exist;
      expect(data.partners[0].url).to.exist;
      expect(data.partners[0].imageUrl).to.exist;
      expect(data.partners[0].blurb).to.exist;
    });

    it('should respect pagination', async () => {
      const {
        data: { getCollectionPartners: data },
      } = await server.executeOperation({
        query: GET_COLLECTION_PARTNERS,
        variables: {
          page: 2,
          perPage: 2,
        },
      });

      // We expect to get two results back
      expect(data.partners.length).to.equal(2);

      // Starting from page 2 of results, that is, from Wearable Tools
      expect(data.partners[0].name).to.equal('Wearable Tools');
      expect(data.partners[1].name).to.equal('Your Choice Wearables');
    });

    it('should return a pagination object', async () => {
      const {
        data: { getCollectionPartners: data },
      } = await server.executeOperation({
        query: GET_COLLECTION_PARTNERS,
        variables: {
          page: 2,
          perPage: 3,
        },
      });

      expect(data.pagination.currentPage).to.equal(2);
      expect(data.pagination.totalPages).to.equal(2);
      expect(data.pagination.totalResults).to.equal(4);
      expect(data.pagination.perPage).to.equal(3);
    });

    it('should return data if no variables are supplied', async () => {
      const {
        data: { getCollectionPartners: data },
      } = await server.executeOperation({
        query: GET_COLLECTION_PARTNERS,
      });

      // Expect to get all our authors back
      expect(data.partners.length).to.equal(4);

      // Expect to see the app defaults for 'page' and 'perPage' variables
      expect(data.pagination.currentPage).to.equal(1);
      expect(data.pagination.perPage).to.equal(
        config.app.pagination.partnersPerPage
      );
    });
  });

  describe('getCollectionPartner query', () => {
    let partner: CollectionPartner;

    beforeAll(async () => {
      const name = 'Anna Burns';
      const data: CreateCollectionPartnerInput = {
        name,
        url: faker.internet.url(),
        imageUrl: faker.image.imageUrl(),
        blurb: faker.lorem.paragraphs(2),
      };
      partner = await db.collectionPartner.create({ data });
    });

    it('should find a partner record by externalId and return all its properties', async () => {
      const {
        data: { getCollectionPartner: data },
      } = await server.executeOperation({
        query: GET_COLLECTION_PARTNER,
        variables: { id: partner.externalId },
      });

      expect(data.externalId).to.exist;
      expect(data.name).to.exist;
      expect(data.url).to.exist;
      expect(data.imageUrl).to.exist;
      expect(data.blurb).to.exist;
    });

    it('should fail on an invalid partner id', async () => {
      const {
        data: { getCollectionPartner: data },
      } = await server.executeOperation({
        query: GET_COLLECTION_PARTNER,
        variables: { id: 'invalid-id' },
      });

      expect(data).not.to.exist;
    });
  });

  describe('getCollectionPartnerAssociation query', () => {
    it('should get an association by its externalId', async () => {
      const association = await createCollectionPartnerAssociationHelper(db, {
        type: CollectionPartnershipType.PARTNERED,
      });

      const {
        data: { getCollectionPartnerAssociation: data },
      } = await server.executeOperation({
        query: GET_COLLECTION_PARTNER_ASSOCIATION,
        variables: { externalId: association.externalId },
      });

      expect(data).to.exist;
      expect(data.type).to.equal(CollectionPartnershipType.PARTNERED);
      expect(data.partner).to.exist;
    });

    it('should return null on an invalid externalId', async () => {
      await createCollectionPartnerAssociationHelper(db, {
        type: CollectionPartnershipType.PARTNERED,
      });

      const {
        data: { getCollectionPartnerAssociation: data },
      } = await server.executeOperation({
        query: GET_COLLECTION_PARTNER_ASSOCIATION,
        variables: { externalId: 'invalid-id' },
      });

      expect(data).not.to.exist;
    });
  });
});
