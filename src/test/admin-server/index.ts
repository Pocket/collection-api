import { ApolloServer } from 'apollo-server-express';
import { buildSubgraphSchema } from '@apollo/federation';
import { ApolloServerPluginLandingPageDisabled } from 'apollo-server-core';
import { typeDefsAdmin } from '../../typeDefs';
import { resolvers as adminResolvers } from '../../admin/resolvers';
import { client } from '../../database/client';

// Export this separately so that it can be used in Apollo integration tests
export const db = client();

// We can't use the server as defined in src/admin/server
// as the Sentry plugin gets in the way of tests
export const server = new ApolloServer({
  schema: buildSubgraphSchema([
    { typeDefs: typeDefsAdmin, resolvers: adminResolvers },
  ]),
  context: {
    db,
  },
  // Note the absence of the Sentry plugin - it emits
  // "Cannot read property 'headers' of undefined" errors in tests.
  // We get console.log statements that resolvers emit instead
  // but the tests pass.
  plugins: [ApolloServerPluginLandingPageDisabled()],
});
