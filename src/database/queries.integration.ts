import { PrismaClient } from '@prisma/client';
import { getCollection } from './queries';
import {clear as clearDb, createAuthor, createCollection} from '../test/helpers';

const db = new PrismaClient();

describe('queries', () => {
  beforeAll(async () => {
    await clearDb(db);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it('can get a collection', async () => {
    const author = await createAuthor(db, 1, 'brave');
    await createCollection(db, 'test me', author);

    const collection = await getCollection(db, 'test-me');

    expect(collection.title).toEqual('test me');
    expect(collection.authors).not.toBeNull();
    expect(collection.stories).not.toBeNull();
  });
});
