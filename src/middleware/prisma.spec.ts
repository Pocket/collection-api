import { MiddlewareParams } from 'prisma';

import * as PrismaMiddleware from './prisma';

describe('prisma middleware', () => {
  const collection1: PrismaMiddleware.CollectionWithStories = {
    id: 1,
    externalId: 'abc-123',
    slug: 'all-about-bowling',
    title: 'All About Bowling',
    excerpt: 'test',
    intro: 'test',
    imageUrl: 'test',
    status: 'draft',
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    stories: [
      {
        id: 1,
        externalId: 'xyz-123',
        collectionId: 1,
        url: 'test.com/bowling',
        title: 'test',
        excerpt: 'test',
        imageUrl: 'test',
        authors: 'test',
        publisher: 'test',
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        externalId: 'xyz-125',
        collectionId: 1,
        url: 'https://thedude.com/walter/calm',
        title: 'test',
        excerpt: 'test',
        imageUrl: 'test',
        authors: 'test',
        publisher: 'test',
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };

  const collection2: PrismaMiddleware.CollectionWithStories = {
    id: 1,
    externalId: 'abc-123',
    slug: 'all-about-bowling',
    title: 'All About Bowling',
    excerpt: 'test',
    intro: 'test',
    imageUrl: 'test',
    status: 'draft',
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    stories: [
      {
        id: 1,
        externalId: 'xyz-123',
        collectionId: 1,
        url: 'test.com/bowling',
        title: 'test',
        excerpt: 'test',
        imageUrl: 'test',
        authors: 'test',
        publisher: 'test',
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        externalId: 'xyz-125',
        collectionId: 1,
        url: 'https://thedude.com/walter/calm',
        title: 'test',
        excerpt: 'test',
        imageUrl: 'test',
        authors: 'test',
        publisher: 'test',
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };

  describe('injectItemIntoCollectionStories', () => {
    it('should inject an item property for each story', () => {
      const res: PrismaMiddleware.CollectionWithStoriesWithItem = PrismaMiddleware.injectItemIntoCollectionStories(
        collection1
      );

      expect(res.stories[0].item.givenUrl).toEqual('test.com/bowling');
      expect(res.stories[1].item.givenUrl).toEqual(
        'https://thedude.com/walter/calm'
      );
    });
  });

  describe('collectionStoryInjectItemMiddleware', () => {
    let params: MiddlewareParams;
    let injectItemSpy;

    const nextSingle = async function (params: MiddlewareParams) {
      return await collection1;
    };

    const nextMany = async function (params: MiddlewareParams) {
      return await [collection1, collection2];
    };

    beforeEach(() => {
      // reset the params object
      params = {
        model: 'Collection',
        args: 'foo',
        dataPath: ['test'],
        runInTransaction: false,
      };

      // spy on inject function
      injectItemSpy = jest.spyOn(
        PrismaMiddleware,
        'injectItemIntoCollectionStories'
      );
    });

    afterEach(() => {
      // restore the spy
      injectItemSpy.mockRestore();
    });

    it('should apply middleware for a Collection query of findUnique', async () => {
      params.action = 'findUnique';

      await PrismaMiddleware.collectionStoryInjectItemMiddleware(
        params,
        nextSingle
      );

      expect(injectItemSpy).toBeCalledTimes(1);
    });

    it('should apply middleware for a Collection query of findFirst', async () => {
      params.action = 'findFirst';

      await PrismaMiddleware.collectionStoryInjectItemMiddleware(
        params,
        nextSingle
      );

      expect(injectItemSpy).toBeCalledTimes(1);
    });

    it('should apply middleware for a Collection query of findMany', async () => {
      params.action = 'findMany';

      await PrismaMiddleware.collectionStoryInjectItemMiddleware(
        params,
        nextMany
      );

      // nextMany returns two collections in an array, so the inject function
      // should have been called twice
      expect(injectItemSpy).toBeCalledTimes(2);
    });

    it('should not apply middleware when a Collection is updated', async () => {
      params.action = 'update';

      await PrismaMiddleware.collectionStoryInjectItemMiddleware(
        params,
        nextSingle
      );

      // param action is update so the inject function should not be called
      expect(injectItemSpy).toBeCalledTimes(0);
    });

    it('should not apply middleware when a Collection is created', async () => {
      params.action = 'create';

      await PrismaMiddleware.collectionStoryInjectItemMiddleware(
        params,
        nextSingle
      );

      // param action is create so the inject function should not be called
      expect(injectItemSpy).toBeCalledTimes(0);
    });

    it('should not apply middleware on a non-Collection object', async () => {
      params.model = 'CollectionStory';
      params.action = 'findFirst';

      await PrismaMiddleware.collectionStoryInjectItemMiddleware(
        params,
        nextSingle
      );

      // param model is not a Collection so the inject function should not be called
      expect(injectItemSpy).toBeCalledTimes(0);
    });
  });
});
