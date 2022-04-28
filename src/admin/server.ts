import { ApolloServer } from 'apollo-server-express';
import { buildSubgraphSchema } from '@apollo/federation';
import { Request } from 'express';
import { typeDefsAdmin } from '../typeDefs';
import { resolvers as adminResolvers } from './resolvers';
import { errorHandler, sentryPlugin } from '@pocket-tools/apollo-utils';
import {
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginLandingPageGraphQLPlayground,
} from 'apollo-server-core';
import { ContextManager } from './context';

// Function signature for context creator; primarily for
// injecting test contexts
interface ContextFactory {
  (req: Request): ContextManager;
}

/**
 * Sets up and configures an ApolloServer for the application.
 * @param contextFactory function for creating the context with
 * every request
 * @returns ApolloServer
 */
export function getServer(contextFactory: ContextFactory): ApolloServer {
  return new ApolloServer({
    schema: buildSubgraphSchema([
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
    context: ({ req }) => contextFactory(req),
    formatError: errorHandler,
  });
}

/**
 * Create and start the apollo server. Required to await server.start()
 * before applying middleware per apollo-server 3 migration.
 */
export async function startServer(
  contextFactory: ContextFactory
): Promise<ApolloServer> {
  const server = getServer(contextFactory);
  await server.start();
  return server;
}
