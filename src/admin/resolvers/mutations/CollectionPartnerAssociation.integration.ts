import { expect } from 'chai';
import { print } from 'graphql';
import request from 'supertest';
import { ApolloServer } from '@apollo/server';
import { PrismaClient } from '@prisma/client';
import { client } from '../../../database/client';

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
} from '../../../test/helpers';
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
import { startServer } from '../../../express';
import { IAdminContext } from '../../context';

describe('mutations: CollectionPartnerAssociation', () => {
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

      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(CREATE_COLLECTION_PARTNER_ASSOCIATION),
          variables: { data: input },
        });

      // All the optional fields should be empty
      expect(result.body.data.createCollectionPartnerAssociation.name).not.to
        .exist;
      expect(result.body.data.createCollectionPartnerAssociation.url).not.to
        .exist;
      expect(result.body.data.createCollectionPartnerAssociation.blurb).not.to
        .exist;
      expect(result.body.data.createCollectionPartnerAssociation.imageUrl).not
        .to.exist;

      // There should be a type set
      expect(result.body.data.createCollectionPartnerAssociation.type).to.equal(
        CollectionPartnershipType.PARTNERED,
      );

      // There should be a linked partner
      expect(
        result.body.data.createCollectionPartnerAssociation.partner.externalId,
      ).to.equal(partner.externalId);
      expect(
        result.body.data.createCollectionPartnerAssociation.partner.name,
      ).to.equal(partner.name);
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

      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(CREATE_COLLECTION_PARTNER_ASSOCIATION),
          variables: { data: input },
        });

      // There should be a type set
      expect(result.body.data.createCollectionPartnerAssociation.type).to.equal(
        CollectionPartnershipType.PARTNERED,
      );

      // All the optional fields should match our inputs
      expect(result.body.data.createCollectionPartnerAssociation.name).to.equal(
        input.name,
      );
      expect(result.body.data.createCollectionPartnerAssociation.url).to.equal(
        input.url,
      );
      expect(
        result.body.data.createCollectionPartnerAssociation.blurb,
      ).to.equal(input.blurb);
      expect(
        result.body.data.createCollectionPartnerAssociation.imageUrl,
      ).to.equal(input.imageUrl);

      // There should be a linked partner
      expect(
        result.body.data.createCollectionPartnerAssociation.partner.externalId,
      ).to.equal(partner.externalId);
      expect(
        result.body.data.createCollectionPartnerAssociation.partner.name,
      ).to.equal(partner.name);
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

      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(UPDATE_COLLECTION_PARTNER_ASSOCIATION),
          variables: { data: input },
        });

      expect(result.body.data.updateCollectionPartnerAssociation.type).to.equal(
        input.type,
      );
      expect(result.body.data.updateCollectionPartnerAssociation.name).to.equal(
        input.name,
      );
      expect(result.body.data.updateCollectionPartnerAssociation.url).to.equal(
        input.url,
      );
      expect(
        result.body.data.updateCollectionPartnerAssociation.blurb,
      ).to.equal(input.blurb);
      expect(
        result.body.data.updateCollectionPartnerAssociation.imageUrl,
      ).to.equal(input.imageUrl);
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

      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(UPDATE_COLLECTION_PARTNER_ASSOCIATION),
          variables: { data: input },
        });

      // the internal id is not returned via the API
      delete newPartner.id;

      expect(
        result.body.data.updateCollectionPartnerAssociation.partner,
      ).to.deep.equal(newPartner);
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

      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(UPDATE_COLLECTION_PARTNER_ASSOCIATION_IMAGE_URL),
          variables: { data: input },
        });

      expect(
        result.body.data.updateCollectionPartnerAssociationImageUrl.imageUrl,
      ).to.equal(input.imageUrl);
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

      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(UPDATE_COLLECTION_PARTNER_ASSOCIATION_IMAGE_URL),
          variables: { data: input },
        });

      expect(
        result.body.data.updateCollectionPartnerAssociationImageUrl.name,
      ).to.equal(association.name);
      expect(
        result.body.data.updateCollectionPartnerAssociationImageUrl.url,
      ).to.equal(association.url);
      expect(
        result.body.data.updateCollectionPartnerAssociationImageUrl.blurb,
      ).to.equal(association.blurb);
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
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(DELETE_COLLECTION_PARTNER_ASSOCIATION),
          variables: { externalId: association.externalId },
        });

      expect(result.body.data.deleteCollectionPartnerAssociation.type).to.equal(
        association.type,
      );

      expect(
        result.body.data.deleteCollectionPartnerAssociation.partner.externalId,
      ).to.equal(association.partner.externalId);

      expect(result.body.data.deleteCollectionPartnerAssociation.name).to.equal(
        association.name,
      );

      // make sure the association is really gone
      const found = await getCollectionPartnerAssociation(
        db,
        association.externalId,
      );

      expect(found).not.to.exist;
    });

    it('should fail to delete a collection partner association if the externalId cannot be found', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(DELETE_COLLECTION_PARTNER_ASSOCIATION),
          variables: { externalId: association.externalId + 'typo' },
        });

      expect(result.body.errors.length).to.equal(1);
      expect(result.body.errors[0].message).to.equal(
        `Cannot delete a collection partner association with external ID "${association.externalId}typo"`,
      );
    });

    // this is testing internal db logic - so we don't need to go through the API
    it("should update related stories' sponsorship status", async () => {
      const deleted = await deleteCollectionPartnerAssociation(
        db,
        association.externalId,
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
