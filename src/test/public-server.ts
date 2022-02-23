import { ApolloServer } from 'apollo-server-express';
import { buildSubgraphSchema } from '@apollo/federation';
import {
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginInlineTraceDisabled,
  ApolloServerPluginUsageReportingDisabled,
} from 'apollo-server-core';
import { typeDefsPublic } from '../typeDefs';
import { resolvers } from '../public/resolvers';
import { client } from '../database/client';

// Export this separately so that it can be used in Apollo integration tests
export const db = client();

export const getServer = () => {
  return new ApolloServer({
    schema: buildSubgraphSchema([{ typeDefs: typeDefsPublic, resolvers }]),
    context: {
      db: client(),
    },
    // Note the absence of the Sentry plugin - it emits
    // "Cannot read property 'headers' of undefined" errors in tests.
    // We get console.log statements that resolvers emit instead
    // but the tests pass.
    plugins: [
      ApolloServerPluginLandingPageDisabled(),
      ApolloServerPluginInlineTraceDisabled(),
      ApolloServerPluginUsageReportingDisabled(),
    ],
  });
};
