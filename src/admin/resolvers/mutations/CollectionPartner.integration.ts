import { expect } from 'chai';
import { print } from 'graphql';
import request from 'supertest';
import { ApolloServer } from '@apollo/server';
import { PrismaClient } from '@prisma/client';
import { client } from '../../../database/client';

import {
  CreateCollectionPartnerInput,
  UpdateCollectionPartnerImageUrlInput,
  UpdateCollectionPartnerInput,
} from '../../../database/types';
import { clear as clearDb, createPartnerHelper } from '../../../test/helpers';
import { COLLECTION_CURATOR_FULL } from '../../../shared/constants';
import {
  CREATE_COLLECTION_PARTNER,
  UPDATE_COLLECTION_PARTNER,
  UPDATE_COLLECTION_PARTNER_IMAGE_URL,
} from './sample-mutations.gql';
import { startServer } from '../../../express';
import { IAdminContext } from '../../context';

describe('mutations: CollectionPartner', () => {
  let app: Express.Application;
  let server: ApolloServer<IAdminContext>;
  let graphQLUrl: string;
  let db: PrismaClient;

  const headers = {
    name: 'Test User',
    username: 'test.user@test.com',
    groups: `group1,group2,${COLLECTION_CURATOR_FULL}`,
  };

  beforeAll(async () => {
    // port 0 tells express to dynamically assign an available port
    ({ app, adminServer: server, adminUrl: graphQLUrl } = await startServer(0));
    db = client();
  });

  afterAll(async () => {
    await db.$disconnect();
    await server.stop();
  });

  beforeEach(async () => {
    await clearDb(db);
  });

  describe('createPartner', () => {
    it('should create a collection partner with all fields specified', async () => {
      const input: CreateCollectionPartnerInput = {
        name: 'Podcast Kings',
        url: 'https://test.com',
        blurb: 'What else is there to talk on a podcast about? Only kittens',
        imageUrl: 'https://i.imgur.com/b0O3wZo.jpg',
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(CREATE_COLLECTION_PARTNER),
          variables: { data: input },
        });

      expect(result.body.data.createCollectionPartner.name).to.equal(
        'Podcast Kings'
      );
      expect(result.body.data.createCollectionPartner.url).to.equal(
        'https://test.com'
      );
      expect(result.body.data.createCollectionPartner.blurb).to.equal(
        'What else is there to talk on a podcast about? Only kittens'
      );
      expect(result.body.data.createCollectionPartner.imageUrl).to.equal(
        'https://i.imgur.com/b0O3wZo.jpg'
      );
    });
  });

  describe('updatePartner', () => {
    it('should update a collection partner', async () => {
      const partner = await createPartnerHelper(db, 'Podcast Kings');

      const input: UpdateCollectionPartnerInput = {
        externalId: partner.externalId,
        name: 'Podcast Kings',
        url: 'https://test.com',
        blurb: 'What else is there to talk on a podcast about? Only kittens',
        imageUrl: 'https://i.imgur.com/b0O3wZo.jpg',
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(UPDATE_COLLECTION_PARTNER),
          variables: { data: input },
        });

      expect(result.body.data.updateCollectionPartner.name).to.equal(
        input.name
      );
      expect(result.body.data.updateCollectionPartner.url).to.equal(input.url);
      expect(result.body.data.updateCollectionPartner.blurb).to.equal(
        input.blurb
      );
      expect(result.body.data.updateCollectionPartner.imageUrl).to.equal(
        input.imageUrl
      );
    });
  });

  describe('updatePartnerImageUrl', () => {
    it('should update a collection partner image url', async () => {
      const partner = await createPartnerHelper(db, 'AI For Everyone');
      const randomKitten = 'https://placekitten.com/g/200/300';

      const input: UpdateCollectionPartnerImageUrlInput = {
        externalId: partner.externalId,
        imageUrl: randomKitten,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(UPDATE_COLLECTION_PARTNER_IMAGE_URL),
          variables: { data: input },
        });

      expect(
        result.body.data.updateCollectionPartnerImageUrl.imageUrl
      ).to.equal(input.imageUrl);
    });

    it('should not update any other partner fields', async () => {
      const partner = await createPartnerHelper(db, 'AI For Everyone');
      const randomKitten = 'https://placekitten.com/g/200/300';

      const input: UpdateCollectionPartnerImageUrlInput = {
        externalId: partner.externalId,
        imageUrl: randomKitten,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(UPDATE_COLLECTION_PARTNER_IMAGE_URL),
          variables: { data: input },
        });

      expect(result.body.data.updateCollectionPartnerImageUrl.name).to.equal(
        partner.name
      );
      expect(result.body.data.updateCollectionPartnerImageUrl.url).to.equal(
        partner.url
      );
      expect(result.body.data.updateCollectionPartnerImageUrl.blurb).to.equal(
        partner.blurb
      );
    });
  });
});
