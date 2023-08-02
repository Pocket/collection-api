import { expect } from 'chai';
import sinon from 'sinon';
import * as Sentry from '@sentry/node';
import { client } from '../database/client';
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import config from '../config';

import * as events from './events';

import {
  testAuthor,
  testCollection,
  testCurationCategory,
  testIABCategory,
  testLabels,
  testPartnership,
  testStory,
} from './testData';
import {
  EventBridgeEventType,
  CollectionStatus,
  CollectionLanguage,
} from './types';
import { CollectionComplete } from '../database/types';
import { PrismaClient } from '@prisma/client';
import { serverLogger } from '../express';

describe('event helpers: ', () => {
  const dbClient: PrismaClient = client();

  // setting up stubs and spies
  const sandbox = sinon.createSandbox();

  const clientStub = sandbox
    .stub(EventBridgeClient.prototype, 'send')
    .resolves({ FailedEntryCount: 0 });

  const sentryStub = sandbox.stub(Sentry, 'captureException').resolves();
  const crumbStub = sandbox.stub(Sentry, 'addBreadcrumb').resolves();
  const serverLoggerStub = sandbox.stub(serverLogger, 'error');

  let getCollectionLabelsForSnowplowStub: sinon.SinonStub;

  beforeEach(() => {
    sinon.restore();
    getCollectionLabelsForSnowplowStub = sinon
      .stub(events, 'getCollectionLabelsForSnowplow')
      .resolves(testLabels);
  });

  afterEach(() => {
    sandbox.resetHistory();
    getCollectionLabelsForSnowplowStub.reset();
  });
  afterAll(() => {
    sandbox.restore();
  });

  describe('generateEventBridgePayload function', () => {
    it('should transform db collection object to event payload', async () => {
      const payload = await events.generateEventBridgePayload(
        dbClient,
        EventBridgeEventType.COLLECTION_CREATED,
        { ...testCollection, status: 'ARCHIVED', publishedAt: undefined },
      );

      // assert that db call to fetch labels for collection via CollectionLabel ids is called
      expect(getCollectionLabelsForSnowplowStub.calledOnce).to.be.true;

      // assert all the collection object top level properties are correct
      expect(payload.collection.externalId).to.equal(testCollection.externalId);
      expect(payload.collection.title).to.equal(testCollection.title);
      expect(payload.collection.slug).to.equal(testCollection.slug);
      expect(payload.collection.excerpt).to.equal('');
      expect(payload.collection.imageUrl).to.equal('');
      expect(payload.collection.intro).to.equal('');

      expect(payload.collection.status).to.equal('archived');
      expect(payload.collection.language).to.equal(
        CollectionLanguage[testCollection.language],
      );
      expect(payload.collection.authors.length).to.equal(0);
      expect(payload.collection.stories.length).to.equal(0);
      expect(payload.collection.labels.length).to.equal(testLabels.length);

      // asserting on the empty object ({}) properties
      expect(payload.collection.curationCategory).is.empty;
      expect(payload.collection.partnership).is.empty;
      expect(payload.collection.IABParentCategory).is.empty;
      expect(payload.collection.IABChildCategory).is.empty;

      // assert Date time stamps are converted to unix seconds format
      expect(payload.collection.createdAt).to.equal(1672549200);
      expect(payload.collection.updatedAt).to.equal(1672549200);
      // missing publishedAt should be set to null
      expect(payload.collection.publishedAt).to.equal(null);

      // assert the remaining two props of the payload object are correct
      expect(payload.eventType).to.equal(
        EventBridgeEventType.COLLECTION_CREATED,
      );
      expect(payload.object_version).to.equal('new');
    });

    it('should transform db collection sub types to event payload collection sub types', async () => {
      const dbCollection: CollectionComplete = {
        ...testCollection,
        authors: [testAuthor],
        stories: [testStory],
        curationCategory: testCurationCategory,
        partnership: testPartnership,
        IABParentCategory: testIABCategory,
        IABChildCategory: testIABCategory,
      };

      const payload = await events.generateEventBridgePayload(
        dbClient,
        EventBridgeEventType.COLLECTION_UPDATED,
        dbCollection,
      );

      expect(payload.collection.status).to.equal(
        CollectionStatus[testCollection.status],
      );
      expect(payload.collection.publishedAt).to.equal(1672549200);

      // Testing the transform functions here by deep assertions.
      // These assertions could've been included in the above test but breaking it down into two tests.

      const author = dbCollection.authors[0];
      expect(payload.collection.authors[0]).to.deep.equal({
        collection_author_id: author.externalId,
        image_url: author.imageUrl,
        name: author.name,
        active: author.active,
        slug: author.slug,
        bio: author.bio,
      });

      const story = dbCollection.stories[0];
      expect(payload.collection.stories[0]).to.deep.equal({
        collection_story_id: story.externalId,
        image_url: story.imageUrl,
        is_from_partner: story.fromPartner,
        sort_order: story.sortOrder,
        authors: [
          {
            name: story.authors[0].name,
            sort_order: story.authors[0].sortOrder,
          },
        ],
        url: story.url,
        title: story.title,
        excerpt: story.excerpt,
        publisher: story.publisher,
      });

      expect(payload.collection.labels).to.deep.equal([
        {
          collection_label_id: testLabels[0].externalId,
          name: testLabels[0].name,
        },
        {
          collection_label_id: testLabels[1].externalId,
          name: testLabels[1].name,
        },
      ]);

      expect(payload.collection.curationCategory).to.deep.equal({
        collection_curation_category_id:
          dbCollection.curationCategory.externalId,
        name: dbCollection.curationCategory.name,
        slug: dbCollection.curationCategory.slug,
      });

      expect(payload.collection.partnership).to.deep.equal({
        collection_partnership_id: dbCollection.partnership.externalId,
        name: dbCollection.partnership.name,
        blurb: dbCollection.partnership.blurb,
        image_url: dbCollection.partnership.imageUrl,
        type: dbCollection.partnership.type,
        url: dbCollection.partnership.url,
      });

      expect(payload.collection.IABParentCategory).to.deep.equal({
        collection_iab_parent_category_id:
          dbCollection.IABParentCategory.externalId,
        name: dbCollection.IABParentCategory.name,
        slug: dbCollection.IABParentCategory.slug,
      });

      expect(payload.collection.IABChildCategory).to.deep.equal({
        collection_iab_child_category_id:
          dbCollection.IABChildCategory.externalId,
        name: dbCollection.IABChildCategory.name,
        slug: dbCollection.IABChildCategory.slug,
      });
    });
  });

  describe('sendEvent function', () => {
    it('should send event to event bus with proper event data', async () => {
      const payload = await events.generateEventBridgePayload(
        dbClient,
        EventBridgeEventType.COLLECTION_CREATED,
        testCollection,
      );

      await events.sendEvent(payload);

      // Wait just a tad in case promise needs time to resolve
      setTimeout(() => {
        return;
      }, 100);
      expect(sentryStub.callCount).to.equal(0);
      expect(serverLoggerStub.callCount).to.equal(0);

      // Event was sent to Event Bus
      expect(clientStub.callCount).to.equal(1);

      // Check that the payload is correct; since it's JSON, we need to decode the data
      // otherwise it also does ordering check
      const sendCommand = clientStub.getCall(0).args[0].input as any;
      expect(sendCommand).to.have.property('Entries');
      expect(sendCommand.Entries[0]).to.contain({
        Source: config.aws.eventBus.eventBridge.source,
        EventBusName: config.aws.eventBus.name,
        DetailType: EventBridgeEventType.COLLECTION_CREATED,
      });

      // Compare to initial payload
      expect(sendCommand.Entries[0]['Detail']).to.equal(
        JSON.stringify(payload),
      );
    });

    it('should log error if any events fail to send for collection-created and collection-updated events', async () => {
      /**
       * This test will log errors to the console and that is expected
       */

      clientStub.restore();
      sandbox
        .stub(EventBridgeClient.prototype, 'send')
        .resolves({ FailedEntryCount: 1 });

      let payload = await events.generateEventBridgePayload(
        dbClient,
        EventBridgeEventType.COLLECTION_CREATED,
        testCollection,
      );

      await events.sendEvent(payload);

      // Wait in case promise needs time to resolve
      setTimeout(() => {
        return;
      }, 100);

      expect(sentryStub.callCount).to.equal(1);
      expect(sentryStub.getCall(0).firstArg.message).to.contain(
        `sendEvent: Failed to send event 'collection-created' to event bus`,
      );
      expect(serverLoggerStub.callCount).to.equal(1);
      expect(serverLoggerStub.getCall(0).firstArg).to.contain(
        `sendEvent: Failed to send event to event bus`,
      );
      expect(serverLoggerStub.getCall(0).lastArg.eventType).to.equal(
        EventBridgeEventType.COLLECTION_CREATED,
      );
      expect(serverLoggerStub.getCall(0).lastArg.payload).to.equal(
        JSON.stringify(payload),
      );

      /**
       * asserting for collection-updated event now
       */

      // resetting mocks and spies
      sentryStub.reset();
      serverLoggerStub.resetHistory();

      payload = await events.generateEventBridgePayload(
        dbClient,
        EventBridgeEventType.COLLECTION_UPDATED, // event type i collection-updated
        testCollection,
      );

      await events.sendEvent(payload);

      // Wait in case promise needs time to resolve
      setTimeout(() => {
        return;
      }, 100);

      expect(sentryStub.callCount).to.equal(1);
      expect(sentryStub.getCall(0).firstArg.message).to.contain(
        `Failed to send event 'collection-updated' to event bus`,
      );
      expect(serverLoggerStub.callCount).to.equal(1);
      expect(serverLoggerStub.getCall(0).firstArg).to.contain(
        `sendEvent: Failed to send event to event bus`,
      );
      expect(serverLoggerStub.getCall(0).lastArg.eventType).to.equal(
        EventBridgeEventType.COLLECTION_UPDATED,
      );
      expect(serverLoggerStub.getCall(0).lastArg.payload).to.equal(
        JSON.stringify(payload),
      );
    });
  });

  describe('sendEventBridgeEvent function', () => {
    it('should log error if send call throws error', async () => {
      clientStub.restore();
      sandbox
        .stub(EventBridgeClient.prototype, 'send')
        .rejects(new Error('boo!'));

      await events.sendEventBridgeEvent(
        dbClient,
        EventBridgeEventType.COLLECTION_CREATED,
        testCollection,
      );

      // Wait in case promise needs time to resolve
      setTimeout(() => {
        return;
      }, 100);

      expect(sentryStub.callCount).to.equal(1);
      expect(sentryStub.getCall(0).firstArg.message).to.contain('boo!');
      expect(crumbStub.callCount).to.equal(1);
      expect(crumbStub.getCall(0).firstArg.message).to.contain(
        `sendEventBridgeEvent: Failed to send event 'collection-created' to event bus`,
      );
      expect(serverLoggerStub.callCount).to.equal(1);
      expect(serverLoggerStub.getCall(0).firstArg).to.contain(
        `sendEventBridgeEvent: Failed to send event to event bus`,
      );
      expect(serverLoggerStub.getCall(0).lastArg.eventType).to.equal(
        EventBridgeEventType.COLLECTION_CREATED,
      );
    });
  });
});
