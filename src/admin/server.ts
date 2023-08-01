import { ApolloServer } from '@apollo/server';
import { Server } from 'http';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { typeDefsAdmin } from '../typeDefs';
import { resolvers as adminResolvers } from './resolvers';
import { errorHandler, sentryPlugin } from '@pocket-tools/apollo-utils';
import {
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginInlineTraceDisabled,
  ApolloServerPluginUsageReportingDisabled,
} from '@apollo/server/plugin/disabled';
import { ApolloServerPluginInlineTrace } from '@apollo/server/plugin/inlineTrace';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { IAdminContext } from './context';

/**
 * Sets up and configures an ApolloServer for the application.
 * @returns ApolloServer
 * @param httpServer
 */
export function getAdminServer(
  httpServer: Server,
): ApolloServer<IAdminContext> {
  const defaultPlugins = [
    sentryPlugin,
    ApolloServerPluginDrainHttpServer({ httpServer }),
  ];
  const prodPlugins = [
    ApolloServerPluginLandingPageDisabled(),
    ApolloServerPluginInlineTrace(),
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

  return new ApolloServer<IAdminContext>({
    schema: buildSubgraphSchema([
      { typeDefs: typeDefsAdmin, resolvers: adminResolvers },
    ]),
    plugins,
    formatError: errorHandler,
  });
}

/**
 * Create and start the apollo server. Required to await server.start()
 * before applying middleware.
 */
export async function startAdminServer(
  httpServer: Server,
): Promise<ApolloServer<IAdminContext>> {
  const server = getAdminServer(httpServer);
  await server.start();
  return server;
}
