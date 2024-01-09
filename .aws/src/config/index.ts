const name = 'CollectionAPI';
const domainPrefix = 'collection-api';
const isDev = process.env.NODE_ENV === 'development';
const environment = isDev ? 'Dev' : 'Prod';
const domain = isDev
  ? `${domainPrefix}.getpocket.dev`
  : `${domainPrefix}.readitlater.com`;
const graphqlVariant = isDev ? 'development' : 'current';

// note that when maxCapacity is left undefined, it will default to 16 (which
// should be ample for us at this time - 2024-01-09)
// https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/rds_cluster#max_capacity
const rds = {
  minCapacity: isDev ? 1 : 4,
  maxCapacity: isDev ? 1 : undefined,
};
const githubConnectionArn = isDev
  ? 'arn:aws:codestar-connections:us-east-1:410318598490:connection/7426c139-1aa0-49e2-aabc-5aef11092032'
  : 'arn:aws:codestar-connections:us-east-1:996905175585:connection/5fa5aa2b-a2d2-43e3-ab5a-72ececfc1870';
const branch = isDev ? 'dev' : 'main';
const eventBusName = `PocketEventBridge-${environment}-Shared-Event-Bus`;

export const config = {
  name,
  isDev,
  prefix: `${name}-${environment}`,
  circleCIPrefix: `/${name}/CircleCI/${environment}`,
  shortName: 'COLAPI',
  environment,
  domain,
  graphqlVariant,
  rds,
  codePipeline: {
    githubConnectionArn,
    repository: 'pocket/collection-api',
    branch,
  },
  tags: {
    service: name,
    environment,
  },
  eventBusName,
};
