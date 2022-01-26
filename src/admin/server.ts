import { ApolloServer } from 'apollo-server-express';
import { buildFederatedSchema } from '@apollo/federation';
import { typeDefsAdmin } from '../typeDefs';
import { resolvers as adminResolvers } from './resolvers';
import { sentryPlugin } from '@pocket-tools/apollo-utils';
import {
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginLandingPageGraphQLPlayground,
} from 'apollo-server-core';
import { client } from '../database/client';
import s3 from '../aws/s3';

export const server = new ApolloServer({
  schema: buildFederatedSchema([
    { typeDefs: typeDefsAdmin, resolvers: adminResolvers },
  ]),
  plugins: [
    sentryPlugin,
    // Keep the settings we had when using v.2:
    // no landing page on production + playground in other environments
    process.env.NODE_ENV === 'production'
      ? ApolloServerPluginLandingPageDisabled()
      : ApolloServerPluginLandingPageGraphQLPlayground(),
  ],
  context: {
    db: client(),
    s3,
  },
});
