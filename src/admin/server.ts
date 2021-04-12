import { ApolloServer } from 'apollo-server-express';
import { typeDefsAdmin } from '../typeDefs';
import { resolvers as adminResolvers } from './resolvers';
import { sentryPlugin } from '@pocket-tools/apollo-utils';
import { client } from '../database/client';

export const server = new ApolloServer({
  typeDefs: typeDefsAdmin,
  resolvers: adminResolvers,
  plugins: [sentryPlugin],
  context: {
    db: client(),
  },
});
