import { ApolloServer } from 'apollo-server-express';
import { buildFederatedSchema } from '@apollo/federation';
import { typeDefsPublic } from '../typeDefs';
import { resolvers as publicResolvers } from './resolvers';
import responseCachePlugin from 'apollo-server-plugin-response-cache';
import { GraphQLRequestContext } from 'apollo-server-types';
import { sentryPlugin } from '@pocket-tools/apollo-utils';
import {
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginLandingPageGraphQLPlayground,
} from 'apollo-server-core';
import { client } from '../database/client';
import { collectionLoader } from '../dataLoaders/collectionLoader';

export const server = new ApolloServer({
  schema: buildFederatedSchema([
    { typeDefs: typeDefsPublic, resolvers: publicResolvers },
  ]),
  plugins: [
    //Copied from Apollo docs, the sessionID signifies if we should seperate out caches by user.
    responseCachePlugin({
      //https://www.apollographql.com/docs/apollo-server/performance/caching/#saving-full-responses-to-a-cache
      //The user id is added to the request header by the apollo gateway (client api)
      sessionId: (requestContext: GraphQLRequestContext) =>
        requestContext.request.http.headers.has('userId')
          ? requestContext.request.http.headers.get('userId')
          : null,
    }),
    sentryPlugin,
    // Keep the settings we had when using v.2:
    // no landing page on production + playground in other environments
    process.env.NODE_ENV === 'production'
      ? ApolloServerPluginLandingPageDisabled()
      : ApolloServerPluginLandingPageGraphQLPlayground(),
  ],
  context: {
    db: client(),
    dataLoaders: {
      collectionLoader,
    },
  },
});
