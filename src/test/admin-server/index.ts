import { ApolloServer } from 'apollo-server-express';
import { buildFederatedSchema } from '@apollo/federation';
import { typeDefsAdmin } from '../../typeDefs';
import { resolvers as adminResolvers } from '../../admin/resolvers';
import { sentryPlugin } from '@pocket-tools/apollo-utils';
import { client } from '../../database/client';

// Export this separately so that it can be used in Apollo integration tests
export const db = client();

export const server = new ApolloServer({
  schema: buildFederatedSchema([
    { typeDefs: typeDefsAdmin, resolvers: adminResolvers },
  ]),
  plugins: [sentryPlugin],
  context: {
    db,
  },
  uploads: false,
  playground: false,
});
