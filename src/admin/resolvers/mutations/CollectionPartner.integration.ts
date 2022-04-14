import { expect } from 'chai';
import {
  CreateCollectionPartnerInput,
  UpdateCollectionPartnerImageUrlInput,
  UpdateCollectionPartnerInput,
} from '../../../database/types';
import {
  clear as clearDb,
  createPartnerHelper,
  getServerWithMockedHeaders,
} from '../../../test/helpers';
import { db } from '../../../test/admin-server';
import { COLLECTION_CURATOR_FULL } from '../../../shared/constants';
import {
  CREATE_COLLECTION_PARTNER,
  UPDATE_COLLECTION_PARTNER,
  UPDATE_COLLECTION_PARTNER_IMAGE_URL,
} from './sample-mutations.gql';

describe('mutations: CollectionPartner', () => {
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

  describe('createPartner', () => {
    it('should create a collection partner with all fields specified', async () => {
      const input: CreateCollectionPartnerInput = {
        name: 'Podcast Kings',
        url: 'https://test.com',
        blurb: 'What else is there to talk on a podcast about? Only kittens',
        imageUrl: 'https://i.imgur.com/b0O3wZo.jpg',
      };

      const { data } = await server.executeOperation({
        query: CREATE_COLLECTION_PARTNER,
        variables: { data: input },
      });

      expect(data.createCollectionPartner.name).to.equal('Podcast Kings');
      expect(data.createCollectionPartner.url).to.equal('https://test.com');
      expect(data.createCollectionPartner.blurb).to.equal(
        'What else is there to talk on a podcast about? Only kittens'
      );
      expect(data.createCollectionPartner.imageUrl).to.equal(
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

      const { data } = await server.executeOperation({
        query: UPDATE_COLLECTION_PARTNER,
        variables: { data: input },
      });

      expect(data.updateCollectionPartner.name).to.equal(input.name);
      expect(data.updateCollectionPartner.url).to.equal(input.url);
      expect(data.updateCollectionPartner.blurb).to.equal(input.blurb);
      expect(data.updateCollectionPartner.imageUrl).to.equal(input.imageUrl);
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

      const { data } = await server.executeOperation({
        query: UPDATE_COLLECTION_PARTNER_IMAGE_URL,
        variables: { data: input },
      });

      expect(data.updateCollectionPartnerImageUrl.imageUrl).to.equal(
        input.imageUrl
      );
    });

    it('should not update any other partner fields', async () => {
      const partner = await createPartnerHelper(db, 'AI For Everyone');
      const randomKitten = 'https://placekitten.com/g/200/300';

      const input: UpdateCollectionPartnerImageUrlInput = {
        externalId: partner.externalId,
        imageUrl: randomKitten,
      };

      const { data } = await server.executeOperation({
        query: UPDATE_COLLECTION_PARTNER_IMAGE_URL,
        variables: { data: input },
      });

      expect(data.updateCollectionPartnerImageUrl.name).to.equal(partner.name);
      expect(data.updateCollectionPartnerImageUrl.url).to.equal(partner.url);
      expect(data.updateCollectionPartnerImageUrl.blurb).to.equal(
        partner.blurb
      );
    });
  });
});
