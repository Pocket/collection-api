import { ApolloServer } from 'apollo-server-express';
import { buildFederatedSchema } from '@apollo/federation';
import { typeDefsAdmin } from '../typeDefs';
import { resolvers as adminResolvers } from './resolvers';
import { sentryPlugin } from '@pocket-tools/apollo-utils';
import { client } from '../database/client';

export const server = new ApolloServer({
  // NOTE! this server is *not* part of the federated schema
  // the only reason we are calling `buildFederatedSchema` here is because
  // our shared schema file incorporates federation-related syntax,
  // and ApolloServer will fail on that *unless* we build the schema
  // as federated.
  schema: buildFederatedSchema([
    { typeDefs: typeDefsAdmin, resolvers: adminResolvers },
  ]),
  plugins: [sentryPlugin],
  context: {
    db: client(),
  },
});
