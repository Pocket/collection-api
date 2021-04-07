import { ApolloServer } from 'apollo-server-express';
import { typeDefsAdmin } from '../typeDefs';
import { resolvers as adminResolvers } from './resolvers';
import { sentryPlugin } from '@pocket-tools/apollo-utils';

export const server = new ApolloServer({
  typeDefs: typeDefsAdmin,
  resolvers: adminResolvers,
  plugins: [sentryPlugin],
});
