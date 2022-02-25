import * as faker from 'faker';
import { CollectionPartner } from '@prisma/client';
import config from '../../../config';
import { db, getServer } from '../';
import {
  clear as clearDb,
  createPartnerHelper,
  getServerWithMockedHeaders,
} from '../../helpers';
import { CreateCollectionPartnerInput } from '../../../database/types';
import { GET_COLLECTION_PARTNER, GET_COLLECTION_PARTNERS } from './queries.gql';
import {
  ACCESS_DENIED_ERROR,
  COLLECTION_CURATOR_FULL,
  READONLY,
} from '../../../shared/constants';

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

      expect(data.partners[0].name).toEqual('Free Range Voiceover');
      expect(data.partners[1].name).toEqual('True Swag');
      expect(data.partners[2].name).toEqual('Wearable Tools');
      expect(data.partners[3].name).toEqual('Your Choice Wearables');
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

      expect(data.partners[0].externalId).toBeTruthy();
      expect(data.partners[0].name).toBeTruthy();
      expect(data.partners[0].url).toBeTruthy();
      expect(data.partners[0].imageUrl).toBeTruthy();
      expect(data.partners[0].blurb).toBeTruthy();
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
      expect(data.partners.length).toEqual(2);

      // Starting from page 2 of results, that is, from Wearable Tools
      expect(data.partners[0].name).toEqual('Wearable Tools');
      expect(data.partners[1].name).toEqual('Your Choice Wearables');
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

      expect(data.pagination.currentPage).toEqual(2);
      expect(data.pagination.totalPages).toEqual(2);
      expect(data.pagination.totalResults).toEqual(4);
      expect(data.pagination.perPage).toEqual(3);
    });

    it('should return data if no variables are supplied', async () => {
      const {
        data: { getCollectionPartners: data },
      } = await server.executeOperation({
        query: GET_COLLECTION_PARTNERS,
      });

      // Expect to get all our authors back
      expect(data.partners.length).toEqual(4);

      // Expect to see the app defaults for 'page' and 'perPage' variables
      expect(data.pagination.currentPage).toEqual(1);
      expect(data.pagination.perPage).toEqual(
        config.app.pagination.partnersPerPage
      );
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
      expect(result.errors).toBeFalsy();

      // and data should exist
      expect(result.data).toBeTruthy();
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
      expect(result.data).toBeFalsy();

      // And there is an access denied error
      expect(result.errors[0].message).toMatch(ACCESS_DENIED_ERROR);
    });

    it('should fail if auth headers are empty', async () => {
      const server = getServer();

      const result = await server.executeOperation({
        query: GET_COLLECTION_PARTNERS,
      });

      // ...without success. There is no data
      expect(result.data).toBeFalsy();

      // And there is an access denied error
      expect(result.errors[0].message).toMatch(ACCESS_DENIED_ERROR);
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

      expect(data.externalId).toBeTruthy();
      expect(data.name).toBeTruthy();
      expect(data.url).toBeTruthy();
      expect(data.imageUrl).toBeTruthy();
      expect(data.blurb).toBeTruthy();
    });

    it('should fail on an invalid partner id', async () => {
      const {
        data: { getCollectionPartner: data },
      } = await server.executeOperation({
        query: GET_COLLECTION_PARTNER,
        variables: { id: 'invalid-id' },
      });

      expect(data).toBeNull();
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
      expect(result.errors).toBeFalsy();

      // and data should exist
      expect(result.data).toBeTruthy();
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
      expect(result.data.getCollectionPartner).toBeFalsy();

      // And there is an access denied error
      expect(result.errors[0].message).toMatch(ACCESS_DENIED_ERROR);
    });

    it('should fail if auth headers are empty', async () => {
      const server = getServer();

      const result = await server.executeOperation({
        query: GET_COLLECTION_PARTNER,
        variables: { id: partner.externalId },
      });

      // ...without success. There is no data
      expect(result.data.getCollectionPartner).toBeFalsy();

      // And there is an access denied error
      expect(result.errors[0].message).toMatch(ACCESS_DENIED_ERROR);
    });
  });
});
