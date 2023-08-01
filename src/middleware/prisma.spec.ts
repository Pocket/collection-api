import { Prisma, CollectionStatus } from '@prisma/client';

import * as PrismaMiddleware from './prisma';

describe('prisma middleware', () => {
  const collection1: PrismaMiddleware.CollectionWithStories = {
    id: 1,
    externalId: 'abc-123',
    slug: 'all-about-bowling',
    title: 'All About Bowling',
    excerpt: 'test',
    intro: 'test',
    language: 'EN',
    imageUrl: 'test',
    status: CollectionStatus.DRAFT,
    curationCategoryId: 1,
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    IABParentCategoryId: 1,
    IABChildCategoryId: 2,
    stories: [
      {
        id: 1,
        externalId: 'xyz-123',
        collectionId: 1,
        url: 'test.com/bowling',
        title: 'test',
        excerpt: 'test',
        imageUrl: 'test',
        publisher: 'test',
        sortOrder: 0,
        fromPartner: false,
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
        publisher: 'test',
        sortOrder: 0,
        fromPartner: false,
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
    language: 'EN',
    status: CollectionStatus.DRAFT,
    curationCategoryId: 1,
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    IABParentCategoryId: 1,
    IABChildCategoryId: 2,
    stories: [
      {
        id: 1,
        externalId: 'xyz-123',
        collectionId: 1,
        url: 'test.com/bowling',
        title: 'test',
        excerpt: 'test',
        imageUrl: 'test',
        publisher: 'test',
        sortOrder: 0,
        fromPartner: false,
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
        publisher: 'test',
        sortOrder: 0,
        fromPartner: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };

  describe('injectItemIntoCollectionStories', () => {
    it('should inject an item property for each story', () => {
      const res: PrismaMiddleware.CollectionWithStoriesWithItem =
        PrismaMiddleware.injectItemIntoCollectionStories(collection1);

      expect(res.stories[0].item.givenUrl).toEqual('test.com/bowling');
      expect(res.stories[1].item.givenUrl).toEqual(
        'https://thedude.com/walter/calm',
      );
    });

    it('should return the collection unaltered if it does not contain stories', () => {
      const c: any = {
        id: 1,
        externalId: 'abc-123',
        slug: 'all-about-bowling',
        title: 'All About Bowling',
        excerpt: 'test',
        intro: 'test',
        imageUrl: 'test',
        status: CollectionStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const res: any = PrismaMiddleware.injectItemIntoCollectionStories(c);

      expect(res).toEqual(c);
    });

    it('should return null if no collection was found', () => {
      // if no collection was found, `null` will be passed
      const res: any = PrismaMiddleware.injectItemIntoCollectionStories(null);

      expect(res).toEqual(null);
    });
  });

  describe('collectionStoryInjectItemMiddleware', () => {
    let params: Prisma.MiddlewareParams;
    let injectItemSpy;

    const nextSingle = async function (params: Prisma.MiddlewareParams) {
      return await collection1;
    };

    const nextMany = async function (params: Prisma.MiddlewareParams) {
      return await [collection1, collection2];
    };

    beforeEach(() => {
      // reset the params object
      params = {
        action: 'findMany',
        model: 'Collection',
        args: 'foo',
        dataPath: ['test'],
        runInTransaction: false,
      };

      // spy on inject function
      injectItemSpy = jest.spyOn(
        PrismaMiddleware,
        'injectItemIntoCollectionStories',
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
        nextSingle,
      );

      expect(injectItemSpy).toBeCalledTimes(1);
    });

    it('should apply middleware for a Collection query of findFirst', async () => {
      params.action = 'findFirst';

      await PrismaMiddleware.collectionStoryInjectItemMiddleware(
        params,
        nextSingle,
      );

      expect(injectItemSpy).toBeCalledTimes(1);
    });

    it('should apply middleware for a Collection query of findMany', async () => {
      params.action = 'findMany';

      await PrismaMiddleware.collectionStoryInjectItemMiddleware(
        params,
        nextMany,
      );

      // nextMany returns two collections in an array, so the inject function
      // should have been called twice
      expect(injectItemSpy).toBeCalledTimes(2);
    });

    it('should not apply middleware when a Collection is updated', async () => {
      params.action = 'update';

      await PrismaMiddleware.collectionStoryInjectItemMiddleware(
        params,
        nextSingle,
      );

      // param action is update so the inject function should not be called
      expect(injectItemSpy).toBeCalledTimes(0);
    });

    it('should not apply middleware when a Collection is created', async () => {
      params.action = 'create';

      await PrismaMiddleware.collectionStoryInjectItemMiddleware(
        params,
        nextSingle,
      );

      // param action is create so the inject function should not be called
      expect(injectItemSpy).toBeCalledTimes(0);
    });

    it('should not apply middleware on a non-Collection object', async () => {
      params.model = 'CollectionStory';
      params.action = 'findFirst';

      await PrismaMiddleware.collectionStoryInjectItemMiddleware(
        params,
        nextSingle,
      );

      // param model is not a Collection so the inject function should not be called
      expect(injectItemSpy).toBeCalledTimes(0);
    });
  });
});
