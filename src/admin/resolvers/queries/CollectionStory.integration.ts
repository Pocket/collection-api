import { expect } from 'chai';
import { print } from 'graphql';
import request from 'supertest';
import { ApolloServer } from '@apollo/server';
import { PrismaClient } from '@prisma/client';
import { client } from '../../../database/client';

import {
  clear as clearDb,
  createAuthorHelper,
  createCollectionHelper,
  createCollectionStoryHelper,
  sortCollectionStoryAuthors,
} from '../../../test/helpers';
import { COLLECTION_CURATOR_FULL } from '../../../shared/constants';
import { GET_COLLECTION_STORY } from './sample-queries.gql';
import { startServer } from '../../../express';
import { IAdminContext } from '../../context';

describe('queries: CollectionStory', () => {
  let app: Express.Application;
  let server: ApolloServer<IAdminContext>;
  let graphQLUrl: string;
  let db: PrismaClient;

  const headers = {
    name: 'Test User',
    username: 'test.user@test.com',
    // default to full access - auth tests occur in a separate test file
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

  describe('getCollectionStory', () => {
    let story;

    beforeEach(async () => {
      const author = await createAuthorHelper(db, 'donny');
      const collection = await createCollectionHelper(db, {
        title: 'test me',
        author,
      });

      story = await createCollectionStoryHelper(db, {
        collectionId: collection.id,
        url: 'https://getpocket.com',
        title: 'a story',
        excerpt: 'this is a story, all about how...',
        imageUrl: 'https://some.image',
        authors: [{ name: 'donny', sortOrder: 0 }],
        publisher: 'the verge',
        fromPartner: false,
      });
    });

    it('should retrieve a collection story with authors', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(GET_COLLECTION_STORY),
          variables: {
            externalId: story.externalId,
          },
        });

      const retrieved = result.body.data?.getCollectionStory;

      expect(retrieved.title).to.equal('a story');
      expect(retrieved.authors.length).to.be.greaterThan(0);
    });

    it('should retrieve a collection story with authors sorted correctly', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(GET_COLLECTION_STORY),
          variables: {
            externalId: story.externalId,
          },
        });

      const retrieved = result.body.data?.getCollectionStory;

      // the default sort returned from prisma should match our expected
      // manual sort
      expect(retrieved.authors).to.equal(
        sortCollectionStoryAuthors(retrieved.authors),
      );
    });

    it('should return NOT_FOUND for an unknown externalID', async () => {
      const result = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(GET_COLLECTION_STORY),
          variables: {
            externalId: story.externalId + 'typo',
          },
        });

      expect(result.body.errors.length).to.equal(1);
      expect(result.body.errors[0].message).to.equal(
        `Error - Not Found: ${story.externalId}typo`,
      );
      expect(result.body.errors[0].extensions.code).to.equal('NOT_FOUND');
      expect(result.body.data.getCollectionStory).not.to.exist;
    });
  });
});
