import { PrismaClient } from '@prisma/client';
import { countAuthors, getAuthor, getAuthors } from './CollectionAuthor';
import { clear as clearDb, createAuthorHelper } from '../../test/helpers';

const db = new PrismaClient();

describe('queries: CollectionAuthor', () => {
  beforeEach(async () => {
    await clearDb(db);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe('getAuthor', () => {
    it('should get an author by their externalId', async () => {
      const author = await createAuthorHelper(db, { name: 'the dude' });

      const found = await getAuthor(db, author.externalId);

      expect(found).not.toBeNull();
    });

    it('should fail on an invalid externalId', async () => {
      const author = await createAuthorHelper(db, { name: 'the dude' });

      const found = await getAuthor(db, author.externalId + 'typo');

      expect(found).toBeNull();
    });
  });

  describe('getAuthors', () => {
    it('should get authors and respect paging', async () => {
      // create some authors to retrieve
      await createAuthorHelper(db, { name: 'the dude' });
      await createAuthorHelper(db, { name: 'walter' });
      await createAuthorHelper(db, { name: 'donny' });
      await createAuthorHelper(db, { name: 'maude' });
      await createAuthorHelper(db, { name: 'brandt' });

      // get page 2, with 2 per page
      const results = await getAuthors(db, 2, 2);

      // as we order by name ascending, this should give us maude & the dude
      expect(results.length).toEqual(2);
      expect(results[0].name).toEqual('maude');
      expect(results[1].name).toEqual('the dude');
    });
  });

  describe('countAuthors', () => {
    it('should accurately count collection authors in the system', async () => {
      // create some authors
      await createAuthorHelper(db, { name: 'the dude' });
      await createAuthorHelper(db, { name: 'walter' });
      await createAuthorHelper(db, { name: 'donny' });
      await createAuthorHelper(db, { name: 'maude' });
      await createAuthorHelper(db, { name: 'brandt' });

      const result = await countAuthors(db);

      expect(result).toEqual(5);
    });
  });
});
