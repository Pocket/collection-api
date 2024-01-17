import { ApolloServer, GraphQLRequestContext } from '@apollo/server';
import { Server } from 'http';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { typeDefsPublic } from '../typeDefs';
import { resolvers as publicResolvers } from './resolvers';
import { errorHandler, sentryPlugin } from '@pocket-tools/apollo-utils';
import responseCachePlugin from '@apollo/server-plugin-response-cache';
import {
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginInlineTraceDisabled,
  ApolloServerPluginUsageReportingDisabled,
} from '@apollo/server/plugin/disabled';
import { ApolloServerPluginInlineTrace } from '@apollo/server/plugin/inlineTrace';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloServerPluginUsageReporting } from '@apollo/server/plugin/usageReporting';
import { IPublicContext } from './context';

// export const server = new ApolloServer({
export function getPublicServer(
  httpServer: Server,
): ApolloServer<IPublicContext> {
  const defaultPlugins = [
    sentryPlugin,
    //Copied from Apollo docs, the sessionID signifies if we should seperate out caches by user.
    responseCachePlugin({
      //https://www.apollographql.com/docs/apollo-server/performance/caching/#saving-full-responses-to-a-cache
      //The user id is added to the request header by the apollo gateway (client api)
      sessionId: async (
        requestContext: GraphQLRequestContext<IPublicContext>,
      ) =>
        requestContext.request.http.headers.has('userId')
          ? requestContext.request.http.headers.get('userId')
          : null,
    }),
    ApolloServerPluginDrainHttpServer({ httpServer }),
  ];
  const prodPlugins = [
    ApolloServerPluginLandingPageDisabled(),
    ApolloServerPluginInlineTrace(),
    ApolloServerPluginUsageReporting({
      // the following variables names do not expose sensitive information and
      // pertain to the following public queries:
      // - getCollections(filters, page, perPage)
      // - collectionBySlug(slug)
      sendVariableValues: { onlyNames: ['filters', 'page', 'perPage', 'slug'] },
    }),
  ];
  const nonProdPlugins = [
    ApolloServerPluginLandingPageLocalDefault(),
    ApolloServerPluginInlineTraceDisabled(),
    // Usage reporting is enabled by default if you have APOLLO_KEY in your environment
    ApolloServerPluginUsageReportingDisabled(),
  ];

  const plugins =
    process.env.NODE_ENV === 'production'
      ? defaultPlugins.concat(prodPlugins)
      : defaultPlugins.concat(nonProdPlugins);
  return new ApolloServer<IPublicContext>({
    schema: buildSubgraphSchema([
      { typeDefs: typeDefsPublic, resolvers: publicResolvers },
    ]),
    plugins,
    formatError: errorHandler,
  });
}

export async function startPublicServer(
  httpServer: Server,
): Promise<ApolloServer<IPublicContext>> {
  const server = getPublicServer(httpServer);
  await server.start();
  return server;
}
