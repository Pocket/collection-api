import * as Sentry from '@sentry/node';
import AWSXRay from 'aws-xray-sdk-core';
import xrayExpress from 'aws-xray-sdk-express';
import express from 'express';
import https from 'https';
import { graphqlUploadExpress } from 'graphql-upload';

import config from './config';
import { startServer as startAdminServer } from './admin/server';
import { getContext as getAdminContext } from './admin/context';
import { server as publicServer } from './public/server';

//Set XRAY to just log if the context is missing instead of a runtime error
AWSXRay.setContextMissingStrategy('LOG_ERROR');

//Add the AWS XRAY ECS plugin that will add ecs specific data to the trace
AWSXRay.config([AWSXRay.plugins.ECSPlugin]);

//Capture all https traffic this service sends
//This is to auto capture node fetch requests (like to parser)
AWSXRay.captureHTTPsGlobal(https, true);

//Capture all promises that we make
AWSXRay.capturePromise();

// Initialize sentry
Sentry.init({
  ...config.sentry,
  debug: config.sentry.environment == 'development',
});

(async () => {
  const app = express();

  // If there is no host header (really there always should be...) then use collection-api as the name
  app.use(xrayExpress.openSegment('collections-api'));

  //Set XRay to use the host header to open its segment name.
  AWSXRay.middleware.enableDynamicNaming('*');

  // Upload middleware
  app.use(
    graphqlUploadExpress({
      maxFileSize: config.app.upload.maxSize,
      maxFiles: config.app.upload.maxFiles,
    })
  );

  // Set up Admin Server context, including request headers
  const adminContextFactory = (req: express.Request) => {
    return getAdminContext(req);
  };

  // From v.3 onwards, Apollo Server must be started before applying middleware
  const adminServer = await startAdminServer(adminContextFactory);

  // Apply the admin graphql (This is not part of the federated graph i.e. Client API)
  adminServer.applyMiddleware({ app, path: '/admin' });

  // Same thing for the public server
  await publicServer.start();

  // Apply the public graphql (This is part of the federated graph)
  publicServer.applyMiddleware({ app, path: '/' });

  //Make sure the express app has the xray close segment handler
  app.use(xrayExpress.closeSegment());

  // The `listen` method launches a web server.
  app.listen({ port: 4004 }, () => {
    console.log(
      `🚀 Public server ready at http://localhost:4004${publicServer.graphqlPath}`
    );
    console.log(
      `🚀 Admin server ready at http://localhost:4004${adminServer.graphqlPath}`
    );
  });
})();
