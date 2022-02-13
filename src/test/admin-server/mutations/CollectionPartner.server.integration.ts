import * as faker from 'faker';
import { db, getServer } from '../';
import { clear as clearDb, createPartnerHelper } from '../../helpers';
import {
  CreateCollectionPartnerInput,
  UpdateCollectionPartnerInput,
  UpdateCollectionPartnerImageUrlInput,
} from '../../../database/types';
import {
  CREATE_COLLECTION_PARTNER,
  UPDATE_COLLECTION_PARTNER,
  UPDATE_COLLECTION_PARTNER_IMAGE_URL,
} from './mutations.gql';

describe('mutations: CollectionPartner', () => {
  const createData: CreateCollectionPartnerInput = {
    name: faker.company.companyName(),
    url: faker.internet.url(),
    imageUrl: faker.image.imageUrl(),
    blurb: faker.lorem.paragraphs(2),
  };

  const server = getServer();

  beforeAll(async () => {
    await server.start();
  });

  afterAll(async () => {
    await db.$disconnect();
    await server.stop();
  });

  beforeEach(async () => {
    await clearDb(db);
  });

  describe('createCollectionPartner mutation', () => {
    it('creates a partner with all required variables supplied', async () => {
      const {
        data: { createCollectionPartner: partner },
      } = await server.executeOperation({
        query: CREATE_COLLECTION_PARTNER,
        variables: createData,
      });

      expect(partner.externalId).toBeTruthy();
      expect(partner.name).toEqual(createData.name);
      expect(partner.url).toEqual(createData.url);
      expect(partner.blurb).toEqual(createData.blurb);
      expect(partner.imageUrl).toEqual(createData.imageUrl);
    });

    it('fails when no data is supplied', async () => {
      // Attempt to create a partner with no input data...
      const result = await server.executeOperation({
        query: CREATE_COLLECTION_PARTNER,
      });

      // ...without success. There is no data
      expect(result.data).toBeFalsy();

      // And the server responds with an error about the first variable in the input
      // that is missing
      expect(result.errors[0].message).toMatch(
        'Variable "$name" of required type "String!" was not provided.'
      );
    });
  });

  describe('updateCollectionPartner mutation', () => {
    it('updates a partner', async () => {
      const partner = await createPartnerHelper(
        db,
        faker.company.companyName()
      );

      const input: UpdateCollectionPartnerInput = {
        externalId: partner.externalId,
        name: 'Agatha Christie',
        url: faker.internet.url(),
        blurb: faker.lorem.paragraphs(2),
        imageUrl: faker.image.imageUrl(),
      };

      const {
        data: { updateCollectionPartner: updatedPartner },
      } = await server.executeOperation({
        query: UPDATE_COLLECTION_PARTNER,
        variables: input,
      });

      expect(updatedPartner.name).toEqual(input.name);
      expect(updatedPartner.url).toEqual(input.url);
      expect(updatedPartner.blurb).toEqual(input.blurb);
      expect(updatedPartner.imageUrl).toEqual(input.imageUrl);
    });

    it('does not update optional variables if they are not supplied', async () => {
      const partner = await createPartnerHelper(db, 'Any Name');

      const input: UpdateCollectionPartnerInput = {
        externalId: partner.externalId,
        name: 'Hands-free DevOps',
        url: 'https://www.example.com/hands-free-devops',
        blurb: faker.lorem.sentences(2),
      };

      const {
        data: { updateCollectionPartner: updatedPartner },
      } = await server.executeOperation({
        query: UPDATE_COLLECTION_PARTNER,
        variables: input,
      });

      // Expect the values supplied to be updated
      expect(updatedPartner.name).toEqual(input.name);
      expect(updatedPartner.url).toEqual(input.url);
      expect(updatedPartner.blurb).toEqual(input.blurb);

      // And the rest to stay as is
      expect(updatedPartner.imageUrl).toEqual(partner.imageUrl);
    });
  });

  describe('updateCollectionPartnerImageUrl', () => {
    it("updates a partner's imageUrl and doesn't touch the other props", async () => {
      const partner = await createPartnerHelper(
        db,
        faker.company.companyName()
      );
      const newImageUrl = 'https://www.example.com/ian-fleming.jpg';

      const input: UpdateCollectionPartnerImageUrlInput = {
        externalId: partner.externalId,
        imageUrl: newImageUrl,
      };

      const {
        data: { updateCollectionPartnerImageUrl: updatedPartner },
      } = await server.executeOperation({
        query: UPDATE_COLLECTION_PARTNER_IMAGE_URL,
        variables: input,
      });

      // The image URL should be updated
      expect(updatedPartner.imageUrl).toEqual(input.imageUrl);

      // But the rest of the values should stay the same
      expect(updatedPartner.name).toEqual(partner.name);
      expect(updatedPartner.url).toEqual(partner.url);
      expect(updatedPartner.blurb).toEqual(partner.blurb);
    });
  });
});
