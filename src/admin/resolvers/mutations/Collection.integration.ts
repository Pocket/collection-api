import { expect } from 'chai';
import { print } from 'graphql';
import request from 'supertest';
import * as sinon from 'sinon';

import { ApolloServer } from '@apollo/server';
import { Collection, CollectionStatus, PrismaClient } from '@prisma/client';

import { client } from '../../../database/client';
import {
  clear as clearDb,
  createAuthorHelper,
  createCollectionHelper,
  createCurationCategoryHelper,
  createIABCategoryHelper,
  sortCollectionStoryAuthors,
  createLabelHelper,
} from '../../../test/helpers';
import {
  CollectionLanguage,
  UpdateCollectionImageUrlInput,
  UpdateCollectionInput,
} from '../../../database/types';
import { COLLECTION_CURATOR_FULL } from '../../../shared/constants';
import {
  CREATE_COLLECTION,
  UPDATE_COLLECTION,
  UPDATE_COLLECTION_IMAGE_URL,
} from './sample-mutations.gql';
import { updateCollection } from '../../../database/mutations/Collection';
import { startServer } from '../../../express';
import { IAdminContext } from '../../context';
import { faker } from '@faker-js/faker';
import config from '../../../config';
import * as EventBridgeEvents from '../../../events/events';

describe('mutations: Collection', () => {
  let app: Express.Application;
  let server: ApolloServer<IAdminContext>;
  let graphQLUrl: string;
  let db: PrismaClient;
  let author;
  let curationCategory;
  let IABParentCategory;
  let IABChildCategory;
  let label1;
  let label2;
  let labelList;
  let labelListIds;
  let minimumData;

  const headers = {
    name: 'Test User',
    username: 'test.user@test.com',
    groups: `group1,group2,${COLLECTION_CURATOR_FULL}`,
  };

  // create a stub for the sendEventBridgeEvent function and make it resolve to null.
  const sendEventBridgeEventStub = sinon
    .stub(EventBridgeEvents, 'sendEventBridgeEvent')
    .resolves(null);

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

    // re-create our dependent entities
    author = await createAuthorHelper(db, 'walter');
    curationCategory = await createCurationCategoryHelper(
      db,
      'Personal Finance'
    );
    IABParentCategory = await createIABCategoryHelper(db, 'Entertainment');
    IABChildCategory = await createIABCategoryHelper(
      db,
      'Bowling',
      IABParentCategory
    );

    label1 = await createLabelHelper(db, 'most-read');
    label2 = await createLabelHelper(db, 'best-of-2022');

    // create several labels to exceed collection-label limit
    labelList = [];
    labelListIds = [];
    for (let i = 0; i < config.app.collectionLabelLimit + 1; i++) {
      labelList.push(
        await createLabelHelper(
          db,
          faker.word.adjective() + '-' + faker.word.adjective()
        )
      );
      labelListIds.push(labelList[i].externalId);
    }

    // re-create the minimum data necessary to create a collection
    minimumData = {
      authorExternalId: author.externalId,
      language: CollectionLanguage.EN,
      slug: 'walter-bowls',
      title: 'walter bowls',
    };

    sendEventBridgeEventStub.reset();
  });

  describe('createCollection', () => {
    it('should create a collection with a default status of `draft`', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(CREATE_COLLECTION),
          variables: { data: minimumData },
        });

      expect(result.body.data.createCollection).to.exist;
      expect(result.body.data.createCollection.status).to.equal(
        CollectionStatus.DRAFT
      );
    });

    it('should create a collection with a null publishedAt', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(CREATE_COLLECTION),
          variables: { data: minimumData },
        });

      expect(result.body.data.createCollection.publishedAt).not.to.exist;
    });

    it('should store the curation category when provided', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(CREATE_COLLECTION),
          variables: {
            data: {
              ...minimumData,
              curationCategoryExternalId: curationCategory.externalId,
            },
          },
        });

      expect(result.body.data.createCollection.curationCategory).to.exist;
    });

    it('should fail on a duplicate slug', async () => {
      await createCollectionHelper(db, {
        title: minimumData.title,
        author,
      });

      // create our second collection, trying to use the same slug
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(CREATE_COLLECTION),
          variables: { data: minimumData },
        });

      expect(result.body.data).not.to.exist;
      expect(result.body.errors.length).to.equal(1);
      expect(result.body.errors[0].message).to.equal(
        'A collection with the slug "walter-bowls" already exists'
      );
    });

    it('should return authors, stories and curation category when a collection is created', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(CREATE_COLLECTION),
          variables: {
            data: {
              ...minimumData,
              curationCategoryExternalId: curationCategory.externalId,
            },
          },
        });

      expect(result.body.data.createCollection.authors).to.exist;
      expect(
        result.body.data.createCollection.curationCategory.externalId
      ).to.equal(curationCategory.externalId);
      expect(result.body.data.createCollection.stories).to.exist;
      // there will never be stories on a freshly created collection
      expect(result.body.data.createCollection.stories.length).to.equal(0);
    });

    it('should create a collection with an IAB parent category', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(CREATE_COLLECTION),
          variables: {
            data: {
              ...minimumData,
              IABParentCategoryExternalId: IABParentCategory.externalId,
            },
          },
        });

      expect(
        result.body.data.createCollection.IABParentCategory.externalId
      ).to.equal(IABParentCategory.externalId);
    });

    it('should create a collection with IAB parent and child categories', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(CREATE_COLLECTION),
          variables: {
            data: {
              ...minimumData,
              IABParentCategoryExternalId: IABParentCategory.externalId,
              IABChildCategoryExternalId: IABChildCategory.externalId,
            },
          },
        });

      expect(
        result.body.data.createCollection.IABParentCategory.externalId
      ).to.equal(IABParentCategory.externalId);

      expect(
        result.body.data.createCollection.IABChildCategory.externalId
      ).to.equal(IABChildCategory.externalId);
    });

    it('should create a collection with a label', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(CREATE_COLLECTION),
          variables: {
            data: {
              ...minimumData,
              labelExternalIds: [label1.externalId],
            },
          },
        });

      expect(result.body.data.createCollection.labels[0].externalId).to.equal(
        label1.externalId
      );
      expect(result.body.data.createCollection.labels[0].name).to.equal(
        label1.name
      );
    });

    it('should create a collection with multiple labels', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(CREATE_COLLECTION),
          variables: {
            data: {
              ...minimumData,
              labelExternalIds: [label1.externalId, label2.externalId],
            },
          },
        });

      expect(result.body.data.createCollection.labels).to.have.length(2);
    });

    it('should create collection with max collection-label limit', async () => {
      //remove one label id
      labelListIds.pop();
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(CREATE_COLLECTION),
          variables: {
            data: {
              ...minimumData,
              labelExternalIds: labelListIds,
            },
          },
        });

      expect(result.body.data.createCollection.labels).to.have.length(
        config.app.collectionLabelLimit
      );
    });

    it('should throw an error when creating a collection with multiple labels and collection-label limit is exceeded', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(CREATE_COLLECTION),
          variables: {
            data: {
              ...minimumData,
              labelExternalIds: labelListIds,
            },
          },
        });

      expect(result.body.data).not.to.exist;
      expect(result.body.errors.length).to.equal(1);
      expect(result.body.errors[0].message).to.equal(
        `Too many labels provided: ${config.app.collectionLabelLimit} allowed, ${labelListIds.length} provided.`
      );
    });

    it('should not connect an IAB child category if an IAB parent category is not set', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(CREATE_COLLECTION),
          variables: {
            data: {
              ...minimumData,
              IABChildCategoryExternalId: IABChildCategory.externalId,
            },
          },
        });

      expect(result.body.data.createCollection.IABChildCategory).not.to.exist;
    });

    it('should not connect a partnership', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(CREATE_COLLECTION),
          variables: {
            data: minimumData,
          },
        });

      expect(result.body.data.createCollection.partnership).not.to.exist;
    });

    it('should send event bridge event for collection_created event when collection status is PUBLISHED', async () => {
      await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(CREATE_COLLECTION),
          variables: {
            data: { ...minimumData, status: CollectionStatus.PUBLISHED },
          },
        });

      // assert that the event emitter function is called once
      expect(sendEventBridgeEventStub.calledOnce).to.be.true;
    });

    it('should send event bridge event for collection_created event when collection status is ARCHIVED', async () => {
      await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(CREATE_COLLECTION),
          variables: {
            data: {
              ...minimumData,
              status: CollectionStatus.ARCHIVED,
            },
          },
        });

      // assert that the event emitter function is called once
      expect(sendEventBridgeEventStub.calledOnce).to.be.true;
    });

    it('should NOT send event bridge event for collection_created event when collection status is not PUBLISHED or ARCHIVED', async () => {
      await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(CREATE_COLLECTION),
          variables: {
            data: {
              ...minimumData,
              status: CollectionStatus.DRAFT,
            },
          },
        });

      // assert that the event emitter function is not called
      expect(sendEventBridgeEventStub.calledOnce).to.be.false;
    });
  });

  describe('updateCollection', () => {
    let initial: Collection;

    beforeEach(async () => {
      initial = await createCollectionHelper(db, {
        title: 'first iteration',
        author,
      });
    });

    it('should update a collection', async () => {
      const newAuthor = await createAuthorHelper(db, 'Leo Tolstoy');

      const input: UpdateCollectionInput = {
        authorExternalId: newAuthor.externalId,
        externalId: initial.externalId,
        language: CollectionLanguage.DE,
        slug: initial.slug,
        title: 'second iteration',
        excerpt: 'once upon a time, the internet...',
        status: CollectionStatus.DRAFT,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(UPDATE_COLLECTION),
          variables: {
            data: input,
          },
        });

      // should return the updated info
      expect(result.body.data.updateCollection.title).to.equal(
        'second iteration'
      );
      expect(result.body.data.updateCollection.language).to.equal('DE');

      // should return the updated author
      expect(result.body.data.updateCollection.authors[0].name).to.equal(
        newAuthor.name
      );
    });

    it('should update the updatedAt value', async () => {
      const input: UpdateCollectionInput = {
        authorExternalId: author.externalId,
        externalId: initial.externalId,
        language: CollectionLanguage.DE,
        slug: initial.slug,
        title: 'second iteration',
        excerpt: 'once upon a time, the internet...',
        status: CollectionStatus.DRAFT,
      };

      // We need to mock an API user to call a DB resolver directly in this test
      const adminApiUser = {
        name: 'Test User',
        groups: ['any-group'],
        username: 'test-user-ldap-something',
        hasFullAccess: true,
        canRead: true,
      };

      // updatedAt is not a part of our API schema, but it's important to
      // test that this value is being updated, as it's used in sorting
      // results sent back to public clients
      const updated = await updateCollection(db, input, adminApiUser);

      // should have updated the updatedAt field
      expect(updated.updatedAt.getTime()).to.be.greaterThan(
        initial.updatedAt.getTime()
      );
    });

    it('should update a collection with a curation category', async () => {
      const newCurationCategory = await createCurationCategoryHelper(
        db,
        'Travel'
      );

      const newAuthor = await createAuthorHelper(db, 'Leo Tolstoy');

      const input: UpdateCollectionInput = {
        authorExternalId: newAuthor.externalId,
        curationCategoryExternalId: newCurationCategory.externalId,
        externalId: initial.externalId,
        language: CollectionLanguage.EN,
        slug: initial.slug,
        title: 'second iteration',
        excerpt: 'once upon a time, the internet...',
        status: CollectionStatus.DRAFT,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(UPDATE_COLLECTION),
          variables: {
            data: input,
          },
        });

      // make sure a curation category was connected
      // should return the updated curation category
      expect(result.body.data.updateCollection.curationCategory.name).to.equal(
        newCurationCategory.name
      );
    });

    it('should update a collection and remove a curation category', async () => {
      const input: UpdateCollectionInput = {
        authorExternalId: author.externalId,
        externalId: initial.externalId,
        language: CollectionLanguage.EN,
        slug: initial.slug,
        title: 'second iteration',
        excerpt: 'once upon a time, the internet...',
        status: CollectionStatus.DRAFT,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(UPDATE_COLLECTION),
          variables: {
            data: input,
          },
        });

      // make sure a curation category was disconnected
      expect(result.body.data.updateCollection.curationCategory).not.to.exist;
    });

    it('should update a collection with an IAB parent category', async () => {
      const input: UpdateCollectionInput = {
        IABParentCategoryExternalId: IABParentCategory.externalId,
        authorExternalId: author.externalId,
        externalId: initial.externalId,
        language: CollectionLanguage.EN,
        slug: initial.slug,
        title: 'second iteration',
        excerpt: 'once upon a time, the internet...',
        status: CollectionStatus.DRAFT,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(UPDATE_COLLECTION),
          variables: {
            data: input,
          },
        });

      expect(result.body.data.updateCollection.IABParentCategory.name).to.equal(
        IABParentCategory.name
      );
    });

    it('should update a collection with IAB parent and child categories', async () => {
      const input: UpdateCollectionInput = {
        IABChildCategoryExternalId: IABChildCategory.externalId,
        IABParentCategoryExternalId: IABParentCategory.externalId,
        authorExternalId: author.externalId,
        externalId: initial.externalId,
        language: CollectionLanguage.EN,
        slug: initial.slug,
        title: 'second iteration',
        excerpt: 'once upon a time, the internet...',
        status: CollectionStatus.DRAFT,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(UPDATE_COLLECTION),
          variables: {
            data: input,
          },
        });

      expect(result.body.data.updateCollection.IABParentCategory.name).to.equal(
        IABParentCategory.name
      );
      expect(result.body.data.updateCollection.IABChildCategory.name).to.equal(
        IABChildCategory.name
      );
    });

    it('should update a collection and remove IAB categories', async () => {
      // custom initial collection with IAB details set
      const initial = await createCollectionHelper(db, {
        title: 'first iteration with iab categories',
        author,
        IABParentCategory,
        IABChildCategory,
      });

      const input: UpdateCollectionInput = {
        authorExternalId: author.externalId,
        externalId: initial.externalId,
        language: CollectionLanguage.DE,
        slug: initial.slug,
        title: 'second iteration',
        excerpt: 'once upon a time, the internet...',
        status: CollectionStatus.DRAFT,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(UPDATE_COLLECTION),
          variables: {
            data: input,
          },
        });

      expect(result.body.data.updateCollection.IABParentCategory).not.to.exist;
      expect(result.body.data.updateCollection.IABChildCategory).not.to.exist;
    });

    it('should throw an error for adding number of labels exceeding collection-label limit', async () => {
      const input: UpdateCollectionInput = {
        authorExternalId: author.externalId,
        externalId: initial.externalId,
        language: CollectionLanguage.DE,
        slug: initial.slug,
        title: 'second iteration',
        excerpt: 'once upon a time, the internet...',
        status: CollectionStatus.DRAFT,
        labelExternalIds: labelListIds,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(UPDATE_COLLECTION),
          variables: {
            data: input,
          },
        });

      expect(result.body.data).not.to.exist;
      expect(result.body.errors.length).to.equal(1);
      expect(result.body.errors[0].message).to.equal(
        `Too many labels provided: ${config.app.collectionLabelLimit} allowed, ${labelListIds.length} provided.`
      );
    });

    it('should add maximum allowed labels to a collection', async () => {
      // remove one label id
      labelListIds.pop();
      const input: UpdateCollectionInput = {
        authorExternalId: author.externalId,
        externalId: initial.externalId,
        language: CollectionLanguage.DE,
        slug: initial.slug,
        title: 'second iteration',
        excerpt: 'once upon a time, the internet...',
        status: CollectionStatus.DRAFT,
        labelExternalIds: labelListIds,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(UPDATE_COLLECTION),
          variables: {
            data: input,
          },
        });

      // make sure there are no errors before running other expect() statements
      expect(result.body.data.errors).to.be.undefined;

      // expect to see max allowed labels
      expect(result.body.data.updateCollection.labels).to.have.length(
        config.app.collectionLabelLimit
      );
    });

    it('should add labels to a collection that has not had any previously', async () => {
      const input: UpdateCollectionInput = {
        authorExternalId: author.externalId,
        externalId: initial.externalId,
        language: CollectionLanguage.DE,
        slug: initial.slug,
        title: 'second iteration',
        excerpt: 'once upon a time, the internet...',
        status: CollectionStatus.DRAFT,
        labelExternalIds: [label1.externalId, label2.externalId],
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(UPDATE_COLLECTION),
          variables: {
            data: input,
          },
        });

      // make sure there are no errors before running other expect() statements
      expect(result.body.data.errors).to.be.undefined;

      // expect to see two new labels
      expect(result.body.data.updateCollection.labels).to.have.length(2);
    });

    it('should remove existing labels on a collection if no new labels are provided', async () => {
      // first, let's create a collection with a label
      const initialResult = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(CREATE_COLLECTION),
          variables: {
            data: {
              ...minimumData,
              labelExternalIds: [label1.externalId, label2.externalId],
            },
          },
        });

      // provide a mock input that lacks any labels
      const input: UpdateCollectionInput = {
        authorExternalId: author.externalId,
        externalId: initialResult.body.data.createCollection.externalId,
        language: CollectionLanguage.DE,
        slug: initialResult.body.data.createCollection.slug,
        title: 'second iteration',
        excerpt: 'once upon a time, the internet...',
        status: CollectionStatus.DRAFT,
      };

      // run the update query on the server
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(UPDATE_COLLECTION),
          variables: {
            data: input,
          },
        });

      // make sure there are no errors before running other expect() statements
      expect(result.body.data.errors).to.be.undefined;

      // expect to see no labels whatsoever after the update
      expect(result.body.data.updateCollection.labels).to.have.length(0);
    });

    it('should replace labels if a new set of labels was provided', async () => {
      // first, let's create a collection with a label or two
      const initialResult = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(CREATE_COLLECTION),
          variables: {
            data: {
              ...minimumData,
              labelExternalIds: [label1.externalId, label2.externalId],
            },
          },
        });

      // create two new labels
      const label3 = await createLabelHelper(db, 'flying-is-overrated');
      const label4 = await createLabelHelper(db, 'trains-are-the-best');

      // provide a mock input with two different labels
      const input: UpdateCollectionInput = {
        authorExternalId: author.externalId,
        externalId: initialResult.body.data.createCollection.externalId,
        language: CollectionLanguage.DE,
        labelExternalIds: [label3.externalId, label4.externalId],
        slug: initialResult.body.data.createCollection.slug,
        title: 'second iteration',
        excerpt: 'once upon a time, the internet...',
        status: CollectionStatus.DRAFT,
      };

      // run the update query on the server
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(UPDATE_COLLECTION),
          variables: {
            data: input,
          },
        });

      // make sure there are no errors before running other expect() statements
      expect(result.body.errors).to.be.undefined;

      // expect to see two labels
      expect(result.body.data.updateCollection.labels).to.have.length(2);

      // make sure it's the two new labels we provided in the update variables
      expect(result.body.data.updateCollection.labels[0].name).to.equal(
        label3.name
      );
      expect(result.body.data.updateCollection.labels[0].externalId).to.equal(
        label3.externalId
      );
      expect(result.body.data.updateCollection.labels[1].name).to.equal(
        label4.name
      );
      expect(result.body.data.updateCollection.labels[1].externalId).to.equal(
        label4.externalId
      );
    });

    it('should return all associated data after updating - authors, curation category, IAB categories, stories, labels and story authors', async () => {
      const input: UpdateCollectionInput = {
        IABChildCategoryExternalId: IABChildCategory.externalId,
        IABParentCategoryExternalId: IABParentCategory.externalId,
        authorExternalId: author.externalId,
        curationCategoryExternalId: curationCategory.externalId,
        externalId: initial.externalId,
        labelExternalIds: [label1.externalId, label2.externalId],
        language: CollectionLanguage.DE,
        slug: initial.slug,
        title: 'second iteration',
        excerpt: 'once upon a time, the internet...',
        status: CollectionStatus.DRAFT,
      };

      // should return the updated info
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(UPDATE_COLLECTION),
          variables: {
            data: input,
          },
        });

      expect(
        result.body.data.updateCollection.authors.length
      ).to.be.greaterThan(0);
      expect(
        result.body.data.updateCollection.stories.length
      ).to.be.greaterThan(0);

      for (
        let i = 0;
        i < result.body.data.updateCollection.stories.length;
        i++
      ) {
        expect(result.body.data.updateCollection.stories[i].authors).to.exist;
        expect(
          result.body.data.updateCollection.stories[i].authors.length
        ).to.be.greaterThan(0);
      }
      expect(result.body.data.updateCollection.curationCategory).to.exist;
      expect(result.body.data.updateCollection.IABParentCategory).to.exist;
      expect(result.body.data.updateCollection.IABChildCategory).to.exist;
      expect(result.body.data.updateCollection.labels).to.have.lengthOf(2);
    });

    it('should return story author sorted correctly', async () => {
      const input: UpdateCollectionInput = {
        authorExternalId: author.externalId,
        externalId: initial.externalId,
        language: CollectionLanguage.DE,
        slug: initial.slug,
        title: 'second iteration',
        excerpt: 'once upon a time, the internet...',
        status: CollectionStatus.DRAFT,
      };

      // should return the updated info
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(UPDATE_COLLECTION),
          variables: {
            data: input,
          },
        });

      expect(result.body.data.updateCollection.stories[0].authors).to.equal(
        sortCollectionStoryAuthors(
          result.body.data.updateCollection.stories[0].authors
        )
      );
    });

    it('should update publishedAt when going to published status', async () => {
      const input: UpdateCollectionInput = {
        authorExternalId: author.externalId,
        externalId: initial.externalId,
        language: CollectionLanguage.EN,
        slug: initial.slug,
        status: CollectionStatus.PUBLISHED,
        title: 'second iteration',
        excerpt: 'once upon a time, the internet...',
      };

      // publishedAt should have a value
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(UPDATE_COLLECTION),
          variables: {
            data: input,
          },
        });

      expect(result.body.data.updateCollection.publishedAt).to.exist;
    });

    it('should not update publishedAt when already published', async () => {
      // update the collection to published
      let input: UpdateCollectionInput = {
        authorExternalId: author.externalId,
        externalId: initial.externalId,
        language: CollectionLanguage.EN,
        slug: initial.slug,
        status: CollectionStatus.PUBLISHED,
        title: 'second iteration',
        excerpt: 'once upon a time, the internet...',
      };

      const publishedResult = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(UPDATE_COLLECTION),
          variables: {
            data: input,
          },
        });

      const published = publishedResult.body.data.updateCollection;

      // update the collection title (leaving all other fields the same)
      input = {
        authorExternalId: author.externalId,
        externalId: initial.externalId,
        language: CollectionLanguage.EN,
        slug: initial.slug,
        status: CollectionStatus.PUBLISHED,
        title: 'third iteration',
        excerpt: 'once upon a time, the internet...',
      };

      const updatedResult = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(UPDATE_COLLECTION),
          variables: {
            data: input,
          },
        });

      // make sure the publishedAt value hasn't changed
      expect(published.publishedAt).to.deep.equal(
        updatedResult.body.data.updateCollection.publishedAt
      );
    });

    it('should fail on a duplicate slug', async () => {
      // this should create a slug of 'let-us-go-bowling'
      const secondCollection = await createCollectionHelper(db, {
        title: 'let us go bowling',
        author,
      });

      // try to update the second collection with the same slug as the first
      const input: UpdateCollectionInput = {
        authorExternalId: author.externalId,
        externalId: secondCollection.externalId,
        language: CollectionLanguage.EN,
        slug: initial.slug,
        title: secondCollection.title,
        excerpt: 'once upon a time, the internet...',
        status: CollectionStatus.DRAFT,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(UPDATE_COLLECTION),
          variables: {
            data: input,
          },
        });

      expect(result.body.data).not.to.exist;
      expect(result.body.errors).to.exist;
      expect(result.body.errors[0].message).to.equal(
        'A collection with the slug "first-iteration" already exists'
      );
    });

    it('should send event bridge event for collection_updated event when collection status is PUBLISHED', async () => {
      const input: UpdateCollectionInput = {
        authorExternalId: author.externalId,
        externalId: initial.externalId,
        language: CollectionLanguage.EN,
        slug: initial.slug,
        status: CollectionStatus.PUBLISHED,
        title: 'second iteration',
        excerpt: 'once upon a time, the internet...',
      };

      await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(UPDATE_COLLECTION),
          variables: {
            data: input,
          },
        });

      expect(sendEventBridgeEventStub.calledOnce).to.be.true;
    });

    it('should send event bridge event for collection_updated event when collection status is ARCHIVED', async () => {
      const input: UpdateCollectionInput = {
        authorExternalId: author.externalId,
        externalId: initial.externalId,
        language: CollectionLanguage.EN,
        slug: initial.slug,
        status: CollectionStatus.ARCHIVED,
        title: 'second iteration',
        excerpt: 'once upon a time, the internet...',
      };

      await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(UPDATE_COLLECTION),
          variables: {
            data: input,
          },
        });

      expect(sendEventBridgeEventStub.calledOnce).to.be.true;
    });

    it('should NOT send event bridge event for collection_updated event when collection status is not PUBLISHED or ARCHIVED', async () => {
      const input: UpdateCollectionInput = {
        authorExternalId: author.externalId,
        externalId: initial.externalId,
        language: CollectionLanguage.EN,
        slug: initial.slug,
        status: CollectionStatus.DRAFT,
        title: 'second iteration',
        excerpt: 'once upon a time, the internet...',
      };

      await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(UPDATE_COLLECTION),
          variables: {
            data: input,
          },
        });

      expect(sendEventBridgeEventStub.calledOnce).to.be.false;
    });
  });

  describe('updateCollectionImageUrl', () => {
    let initial: Collection;

    beforeEach(async () => {
      initial = await createCollectionHelper(db, {
        title: 'first iteration',
        author,
      });
    });

    it('should update a collection image url and no other fields', async () => {
      const randomKitten = 'https://placekitten.com/g/200/300';

      const input: UpdateCollectionImageUrlInput = {
        externalId: initial.externalId,
        imageUrl: randomKitten,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(UPDATE_COLLECTION_IMAGE_URL),
          variables: {
            data: input,
          },
        });

      // we should have a new image url
      expect(result.body.data.updateCollectionImageUrl.imageUrl).to.equal(
        randomKitten
      );

      // other data should be as it was previously
      expect(result.body.data.updateCollectionImageUrl.title).to.equal(
        initial.title
      );
      expect(result.body.data.updateCollectionImageUrl.slug).to.equal(
        initial.slug
      );
      expect(result.body.data.updateCollectionImageUrl.excerpt).to.equal(
        initial.excerpt
      );
      expect(result.body.data.updateCollectionImageUrl.intro).to.equal(
        initial.intro
      );
      expect(result.body.data.updateCollectionImageUrl.status).to.equal(
        initial.status
      );
    });
  });
});
