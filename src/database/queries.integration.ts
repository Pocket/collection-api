import { PrismaClient, CollectionStatus } from '@prisma/client';
import {
  getCollection,
  getCollectionBySlug,
  getCollectionsBySlugs,
} from './queries';
import {
  clear as clearDb,
  createAuthor,
  createCollection,
} from '../test/helpers';

const db = new PrismaClient();

describe('queries', () => {
  beforeEach(async () => {
    await clearDb(db);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it('should create a collection with a null publishedAt', async () => {
    const author = await createAuthor(db, 'walter');
    const initial = await createCollection(
      db,
      'first iteration',
      author,
      CollectionStatus.draft
    );

    expect(initial.publishedAt).toBeFalsy();
  });

  it('can get a collection by external id', async () => {
    const author = await createAuthor(db, 'brave');
    const created = await createCollection(db, 'test me', author);

    const collection = await getCollection(db, created.externalId);

    expect(collection.title).toEqual('test me');
    expect(collection.authors).not.toBeNull();
    expect(collection.stories).not.toBeNull();
  });

  it('can get a collection by slug', async () => {
    const author = await createAuthor(db, 'brave');
    await createCollection(db, 'test me', author);

    const collection = await getCollectionBySlug(db, 'test-me');

    expect(collection.title).toEqual('test me');
    expect(collection.authors).not.toBeNull();
    expect(collection.stories).not.toBeNull();
  });

  it('can get collections by slug', async () => {
    const author = await createAuthor(db, 'brave');
    await createCollection(db, 'test me', author, CollectionStatus.published);
    await createCollection(db, 'test me 2', author, CollectionStatus.published);

    const collections = await getCollectionsBySlugs(db, [
      'test-me',
      'test-me-2',
    ]);

    expect(collections[0].title).toEqual('test me');
    expect(collections[1].title).toEqual('test me 2');
  });
});
