import { ApolloServer } from 'apollo-server-express';
import { buildSubgraphSchema } from '@apollo/federation';
import {
  ApolloServerPluginInlineTraceDisabled,
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginUsageReportingDisabled,
} from 'apollo-server-core';
import { typeDefsAdmin } from '../../typeDefs';
import { resolvers as adminResolvers } from '../../admin/resolvers';
import { client } from '../../database/client';
import { ContextManager } from '../../admin/context';
import s3 from '../../aws/s3';

// Export this separately so that it can be used in Apollo integration tests
export const db = client();

// Only using one value from MozillaAccessGroup enum in Pocket Shared Data
export const COLLECTION_CURATOR_FULL =
  'mozilliansorg_pocket_collection_curator_full';

// We can't use the server as defined in src/admin/server
// as the Sentry plugin gets in the way of tests
export const getServer = (context?: ContextManager) => {
  return new ApolloServer({
    schema: buildSubgraphSchema([
      { typeDefs: typeDefsAdmin, resolvers: adminResolvers },
    ]),
    context: () => {
      // If context has been provided, use that instead.
      return (
        context ??
        new ContextManager({
          request: {
            headers: {},
          },
          db: client(),
          s3,
        })
      );
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
