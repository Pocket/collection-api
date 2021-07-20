import { PrismaClient } from '@prisma/client';
import {
  CreateCollectionPartnerInput,
  UpdateCollectionPartnerImageUrlInput,
  UpdateCollectionPartnerInput,
} from '../types';
import { clear as clearDb, createPartnerHelper } from '../../test/helpers';
import {
  createCollectionPartner,
  updateCollectionPartner,
  updateCollectionPartnerImageUrl,
} from './CollectionPartner';

const db = new PrismaClient();

describe('mutations: CollectionPartner', () => {
  beforeEach(async () => {
    await clearDb(db);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe('createPartner', () => {
    it('should create a collection partner with all fields specified', async () => {
      const data: CreateCollectionPartnerInput = {
        name: 'Podcast Kings',
        url: 'https://test.com',
        blurb: 'What else is there to talk on a podcast about? Only kittens',
        imageUrl: 'https://i.imgur.com/b0O3wZo.jpg',
      };

      const partner = await createCollectionPartner(db, data);

      expect(partner.name).toEqual('Podcast Kings');
      expect(partner.url).toEqual('https://test.com');
      expect(partner.blurb).toEqual(
        'What else is there to talk on a podcast about? Only kittens'
      );
      expect(partner.imageUrl).toEqual('https://i.imgur.com/b0O3wZo.jpg');
    });
  });

  describe('updatePartner', () => {
    it('should update a collection partner', async () => {
      const partner = await createPartnerHelper(db, 'Podcast Kings');

      const data: UpdateCollectionPartnerInput = {
        externalId: partner.externalId,
        name: 'Podcast Kings',
        url: 'https://test.com',
        blurb: 'What else is there to talk on a podcast about? Only kittens',
        imageUrl: 'https://i.imgur.com/b0O3wZo.jpg',
      };

      const updated = await updateCollectionPartner(db, data);

      expect(updated.name).toEqual(data.name);
      expect(updated.url).toEqual(data.url);
      expect(updated.blurb).toEqual(data.blurb);
      expect(updated.imageUrl).toEqual(data.imageUrl);
    });
  });

  describe('updatePartnerImageUrl', () => {
    it('should update a collection partner image url', async () => {
      const partner = await createPartnerHelper(db, 'AI For Everyone');
      const randomKitten = 'https://placekitten.com/g/200/300';

      const data: UpdateCollectionPartnerImageUrlInput = {
        externalId: partner.externalId,
        imageUrl: randomKitten,
      };

      const updated = await updateCollectionPartnerImageUrl(db, data);

      expect(updated.imageUrl).toEqual(data.imageUrl);
    });

    it('should not update any other partner fields', async () => {
      const partner = await createPartnerHelper(db, 'AI For Everyone');
      const randomKitten = 'https://placekitten.com/g/200/300';

      const data: UpdateCollectionPartnerImageUrlInput = {
        externalId: partner.externalId,
        imageUrl: randomKitten,
      };

      const updated = await updateCollectionPartnerImageUrl(db, data);

      expect(updated.name).toEqual(partner.name);
      expect(updated.url).toEqual(partner.url);
      expect(updated.blurb).toEqual(partner.blurb);
    });
  });
});
