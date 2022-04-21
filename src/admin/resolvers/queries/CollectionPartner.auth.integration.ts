import { expect } from 'chai';
import { faker } from '@faker-js/faker';
import { CollectionPartner } from '@prisma/client';
import { db, getServer } from '../../../test/admin-server';
import {
  clear as clearDb,
  createPartnerHelper,
  getServerWithMockedHeaders,
} from '../../../test/helpers';
import { CreateCollectionPartnerInput } from '../../../database/types';
import {
  GET_COLLECTION_PARTNER,
  GET_COLLECTION_PARTNERS,
} from './sample-queries.gql';
import { ACCESS_DENIED_ERROR, READONLY } from '../../../shared/constants';

describe('auth: CollectionPartner', () => {
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

    it('should succeed if a user has only READONLY access', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        // missing any collection/readoly group
        groups: `group1,group2,${READONLY}`,
      };

      const server = getServerWithMockedHeaders(headers);

      const result = await server.executeOperation({
        query: GET_COLLECTION_PARTNERS,
      });

      // we shouldn't have any errors
      expect(result.errors).not.to.exist;

      // and data should exist
      expect(result.data).to.exist;
    });

    it('should fail if user does not have access', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        // missing any collection/readoly group
        groups: `group1,group2`,
      };

      const server = getServerWithMockedHeaders(headers);

      const result = await server.executeOperation({
        query: GET_COLLECTION_PARTNERS,
      });

      // ...without success. There is no data
      expect(result.data).not.to.exist;

      // And there is an access denied error
      expect(result.errors[0].message).to.equal(ACCESS_DENIED_ERROR);
      expect(result.errors[0].extensions.code).to.equal('FORBIDDEN');
    });

    it('should fail if auth headers are empty', async () => {
      const server = getServer();

      const result = await server.executeOperation({
        query: GET_COLLECTION_PARTNERS,
      });

      // ...without success. There is no data
      expect(result.data).not.to.exist;

      // And there is an access denied error
      expect(result.errors[0].message).to.equal(ACCESS_DENIED_ERROR);
      expect(result.errors[0].extensions.code).to.equal('FORBIDDEN');
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

    it('should succeed if a user has only READONLY access', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        // missing any collection/readoly group
        groups: `group1,group2,${READONLY}`,
      };

      const server = getServerWithMockedHeaders(headers);

      const result = await server.executeOperation({
        query: GET_COLLECTION_PARTNER,
        variables: { id: partner.externalId },
      });

      // we shouldn't have any errors
      expect(result.errors).not.to.exist;

      // and data should exist
      expect(result.data).to.exist;
    });

    it('should fail if user does not have access', async () => {
      const headers = {
        name: 'Test User',
        username: 'test.user@test.com',
        // missing any collection/readoly group
        groups: `group1,group2`,
      };

      const server = getServerWithMockedHeaders(headers);

      const result = await server.executeOperation({
        query: GET_COLLECTION_PARTNER,
        variables: { id: partner.externalId },
      });

      // ...without success. There is no data
      expect(result.data.getCollectionPartner).not.to.exist;

      // And there is an access denied error
      expect(result.errors[0].message).to.equal(ACCESS_DENIED_ERROR);
      expect(result.errors[0].extensions.code).to.equal('FORBIDDEN');
    });

    it('should fail if auth headers are empty', async () => {
      const server = getServer();

      const result = await server.executeOperation({
        query: GET_COLLECTION_PARTNER,
        variables: { id: partner.externalId },
      });

      // ...without success. There is no data
      expect(result.data.getCollectionPartner).not.to.exist;

      // And there is an access denied error
      expect(result.errors[0].message).to.equal(ACCESS_DENIED_ERROR);
      expect(result.errors[0].extensions.code).to.equal('FORBIDDEN');
    });
  });
});
