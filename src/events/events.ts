import {
  PutEventsCommand,
  PutEventsCommandOutput,
} from '@aws-sdk/client-eventbridge';
import * as Sentry from '@sentry/node';
import config from '../config/';
import { eventBridgeClient } from '../aws/eventBridgeClient';

import {
  CollectionEventBusPayload,
  EventBridgeEventType,
  Collection,
  CollectionStatus,
  CollectionLanguage,
  CollectionAuthor,
  CollectionStoryAuthor,
  CollectionStory,
  Label,
  CurationCategory,
  CollectionPartnership,
  CollectionPartnershipType,
  IABChildCategory,
  IABParentCategory,
} from './types';
import {
  CollectionComplete,
  CollectionStoryAuthor as dbCollectionStoryAuthor,
  CollectionStoryWithAuthors as dbCollectionStoryWithAuthors,
  Label as dbLabel,
  CollectionPartnership as dbCollectionPartnership,
} from '../database/types';
import {
  PrismaClient,
  CollectionAuthor as dbCollectionAuthor,
  CurationCategory as dbCurationCategory,
  IABCategory as dbIABCategory,
  CollectionLabel,
} from '@prisma/client';

import { getLabelById } from '../shared/resolvers/types';

/** Transformation functions below to map collection object's sub types to the ones in snowplow schema  */

function transformCollectionAuthors(
  collectionAuthors: dbCollectionAuthor[]
): CollectionAuthor[] {
  return collectionAuthors.map((author) => {
    const { externalId, name, active, slug, bio, imageUrl } = author;
    return {
      collection_author_id: externalId,
      image_url: imageUrl ?? '',
      slug: slug ?? '',
      bio: bio ?? '',
      name,
      active,
    };
  });
}

function transformStoryAuthor(
  collectionStoryAuthors: dbCollectionStoryAuthor[]
): CollectionStoryAuthor[] {
  return collectionStoryAuthors.map((storyAuthor) => {
    return {
      name: storyAuthor.name ?? '',
      sort_order: storyAuthor.sortOrder ?? null,
    };
  });
}

function transformCollectionStories(
  collectionStories: dbCollectionStoryWithAuthors[]
): CollectionStory[] {
  return collectionStories.map((collectionStory) => {
    const {
      externalId,
      url,
      title,
      excerpt,
      imageUrl,
      publisher,
      authors,
      fromPartner,
      sortOrder,
    } = collectionStory;
    return {
      collection_story_id: externalId,
      image_url: imageUrl ?? '',
      is_from_partner: fromPartner,
      publisher: publisher ?? '',
      sort_order: sortOrder ?? null,
      authors: transformStoryAuthor(authors),
      url,
      title,
      excerpt,
    };
  });
}

function transformCollectionLabels(collectionLabels: dbLabel[]): Label[] {
  if (collectionLabels.length === 0) {
    return [];
  }

  return collectionLabels.map((label) => {
    return { collection_label_id: label.externalId, name: label.name };
  });
}

function transformCollectionCurationCategory(
  curationCategory: dbCurationCategory
): CurationCategory {
  const { externalId, name, slug } = curationCategory;
  return {
    collection_curation_category_id: externalId,
    name: name ?? '',
    slug: slug ?? '',
  };
}

function transformCollectionPartnership(
  collectionPartnership: dbCollectionPartnership
): CollectionPartnership {
  const { externalId, imageUrl, type, blurb, name, url } =
    collectionPartnership;
  return {
    collection_partnership_id: externalId,
    image_url: imageUrl ?? '',
    blurb: blurb ?? '',
    name: name ?? '',
    url: url ?? '',
    type: CollectionPartnershipType[type],
  };
}

function transformCollectionIABParentCategory(
  iabCategory: dbIABCategory
): IABParentCategory {
  const { externalId, name, slug } = iabCategory;
  return {
    collection_iab_parent_category_id: externalId,
    name: name ?? '',
    slug: slug ?? '',
  };
}

function transformCollectionIABChildCategory(
  iabCategory: dbIABCategory
): IABChildCategory {
  const { externalId, name, slug } = iabCategory;
  return {
    collection_iab_child_category_id: externalId,
    name: name ?? '',
    slug: slug ?? '',
  };
}

/**
 * note this is an arrow function because when stubbing this for spec tests, we were running into closure and 'this' issues.
 */
export const getCollectionLabelsForSnowplow = async (
  dbClient: PrismaClient,
  collectionLabels: CollectionLabel[]
): Promise<dbLabel[]> => {
  const labels: dbLabel[] = [];
  // collectionLabel variable here represents the collection-label connection entity
  // we are using that to fetch the actual Label object
  for await (const collectionLabel of collectionLabels) {
    labels.push(await getLabelById(dbClient, collectionLabel.labelId));
  }
  return labels;
};

/**
 * Converting Date type to unix seconds as expected in snowplow
 */
function getDateInSeconds(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

/**
 * Transforms the collection object from the database to match the snowplow schema
 */
export function transformDbCollectionToSnowplowCollection(
  collection: CollectionComplete,
  collectionLabels: dbLabel[]
): Collection {
  const hasAuthors = collection.authors && collection.authors.length !== 0;
  const hasStories = collection.stories && collection.stories.length !== 0;

  return {
    externalId: collection.externalId,
    slug: collection.slug,
    title: collection.title,
    excerpt: collection.excerpt ?? '',
    intro: collection.intro ?? '',
    imageUrl: collection.imageUrl ?? '',
    status: CollectionStatus[collection.status],
    language: CollectionLanguage[collection.language],
    authors: hasAuthors ? transformCollectionAuthors(collection.authors) : [],
    stories: hasStories ? transformCollectionStories(collection.stories) : [],
    labels: transformCollectionLabels(collectionLabels),
    curationCategory: collection.curationCategory
      ? transformCollectionCurationCategory(collection.curationCategory)
      : {},
    partnership: collection.partnership
      ? transformCollectionPartnership(collection.partnership)
      : {},
    IABParentCategory: collection.IABParentCategory
      ? transformCollectionIABParentCategory(collection.IABParentCategory)
      : {},
    IABChildCategory: collection.IABChildCategory
      ? transformCollectionIABChildCategory(collection.IABChildCategory)
      : {},
    createdAt: getDateInSeconds(collection.createdAt),
    updatedAt: getDateInSeconds(collection.updatedAt),
    publishedAt: collection.publishedAt
      ? getDateInSeconds(collection.publishedAt)
      : null,
  };
}

/**
 * This function sets up the payload to send to Event Bridge for
 * the "collection_created" and "collection_updated" event.
 */
export async function generateEventBridgePayload(
  dbClient: PrismaClient,
  eventType: EventBridgeEventType,
  collection: CollectionComplete
): Promise<CollectionEventBusPayload> {
  // check if collection has any labels and fetch them
  const hasLabels = collection.labels && collection.labels.length !== 0;
  const collectionLabels = hasLabels
    ? await getCollectionLabelsForSnowplow(dbClient, collection.labels)
    : [];

  return {
    collection: transformDbCollectionToSnowplowCollection(
      collection,
      collectionLabels // pass in collection labels to the main transform function
    ),
    eventType: eventType,
    object_version: 'new',
  };
}

/**
 *
 * Function called in the collection database mutation functions for create and update to emit to eventbridge
 */
export async function sendEventBridgeEvent(
  dbClient: PrismaClient,
  eventType: EventBridgeEventType,
  collection: CollectionComplete
) {
  const payload = await generateEventBridgePayload(
    dbClient,
    eventType,
    collection
  );

  // Send to Event Bridge. Yay!
  try {
    await sendEvent(payload);
  } catch (error) {
    // In the unlikely event that the payload generator throws an error,
    // log to Sentry and Cloudwatch but don't halt program
    const failedEventError = new Error(
      `sendEventBridgeEvent: Failed to send event '${
        payload.eventType
      }' to event bus. Event Body:\n ${JSON.stringify(payload)}`
    );
    // Don't halt program, but capture the failure in Sentry and Cloudwatch
    Sentry.addBreadcrumb(failedEventError);
    Sentry.captureException(error);
    console.log(failedEventError);
    console.log(error);
  }
}

/**
 * Send event to Event Bus, pulling the event bus and the event source
 * from the config.
 * Will not throw errors if event fails; instead, log exception to Sentry
 * and add to Cloudwatch logs.
 */
export async function sendEvent(eventPayload: any) {
  const putEventCommand = new PutEventsCommand({
    Entries: [
      {
        EventBusName: config.aws.eventBus.name,
        Detail: JSON.stringify(eventPayload),
        Source: config.aws.eventBus.eventBridge.source,
        DetailType: eventPayload.eventType,
      },
    ],
  });

  const output: PutEventsCommandOutput = await eventBridgeClient.send(
    putEventCommand
  );

  if (output.FailedEntryCount) {
    const failedEventError = new Error(
      `sendEvent: Failed to send event '${
        eventPayload.eventType
      }' to event bus. Event Body:\n ${JSON.stringify(eventPayload)}`
    );

    // Don't halt program, but capture the failure in Sentry and Cloudwatch
    Sentry.captureException(failedEventError);
    console.log(failedEventError);
  }
}
