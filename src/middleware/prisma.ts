import { Collection, CollectionStory } from '@prisma/client';
import { MiddlewareParams } from 'prisma';

// THIS IS WEIRD!
// we are importing every export *in this file* into itself so we can spy
// on nested function calls - see below for more info
import * as PrismaMiddleware from './prisma';

// this type prepares a CollectionStory to have an extra 'item' property
type CollectionStoryWithItem = CollectionStory & {
  item?: {
    // the name of this property *must* be `givenUrl`. this is the name of the
    // field on the Parser Item model that is used to retrieve a Parser Item.
    // all we're doing is duplicating the CollectionStory `url` property here.
    givenUrl: string;
  };
};

// prisma types don't include associations - this is just to have type safety
// in our function param below.
export type CollectionWithStories = Collection & {
  stories: CollectionStory[];
};

// this is simply to define a return type on the function below.
export type CollectionWithStoriesWithItem = Collection & {
  stories: CollectionStoryWithItem[];
};

export function injectItemIntoCollectionStories(
  collection: CollectionWithStories
): CollectionWithStoriesWithItem {
  // a collection may not include stories - if there are none, do nothing
  if (!collection.stories) {
    return collection;
  }

  // map over each CollectionStory, injecting a new `item` property that
  // is a copy of the data in the `url` property.
  const stories = collection.stories.map((story) => {
    return {
      ...story,
      item: {
        givenUrl: story.url,
      },
    };
  });

  // build a new object to conform to the return type
  return {
    ...collection,
    stories,
  };
}

// conforms to the prisma middleware API
// https://www.prisma.io/docs/reference/api-reference/prisma-client-reference/#use
export async function collectionStoryInjectItemMiddleware(
  params: MiddlewareParams,
  next
): Promise<any> {
  // let all other middlewares finish first
  let results = await next(params);

  // we only need to inject extra data for external clients. external
  // clients only retrieve CollectionStories within the context / as
  // children of Collections, so we start branching there.

  // all retrieval queries in prisma begin with 'find' - findUnique, findFirst,
  // findMany. i do *not* like hard coding this 'find' string here. it's
  // setting us up for a bug when merging dependabot PRs.
  if (
    String(params.model) === 'Collection' &&
    params.action.startsWith('find')
  ) {
    // THIS IS WEIRD
    // even though it is defined in this file, notice we are calling the
    // `injectItemIntoCollectionStories` function with the namespace given in
    // the `import` statement above. this is so we can spy on this function
    // in tests.
    if (Array.isArray(results)) {
      results = results.map(PrismaMiddleware.injectItemIntoCollectionStories);
    } else {
      results = PrismaMiddleware.injectItemIntoCollectionStories(results);
    }
  }

  return results;
}
