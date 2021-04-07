import { ApolloServer } from 'apollo-server-express';
import { buildFederatedSchema } from '@apollo/federation';
import { typeDefsPublic } from '../typeDefs';
import { resolvers as publicResolvers } from './resolvers';
import config from '../config';
import responseCachePlugin from 'apollo-server-plugin-response-cache';
import { GraphQLRequestContext } from 'apollo-server-types';
import { sentryPlugin } from '@pocket-tools/apollo-utils';
import { getRedisCache } from '../cache';

const cache = getRedisCache();

export const server = new ApolloServer({
  schema: buildFederatedSchema([
    { typeDefs: typeDefsPublic, resolvers: publicResolvers },
  ]),
  // Set a default cache control of 0 seconds so it respects the individual set cache controls on the schema
  // With this set to 0 it will not cache by default
  cacheControl: { defaultMaxAge: config.app.defaultMaxAge },
  // Caches the queries that apollo clients can send via a hashed get request
  // This allows us to cache resolver decisions
  persistedQueries: {
    cache,
    ttl: 300, // 5 minutes
  },
  //The cache that Apollo should use for all of its responses
  //https://www.apollographql.com/docs/apollo-server/data/data-sources/#using-memcachedredis-as-a-cache-storage-backend
  //This will only be used if all data in the response is cacheable
  //This will add the CDN cache control headers to the response and will cache it in memcached if its cacheable
  cache,
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
  ],
});
