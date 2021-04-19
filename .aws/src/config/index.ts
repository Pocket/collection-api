const name = 'CollectionAPI';
const domainPrefix = 'collection-api';
const isDev = process.env.NODE_ENV === 'development';
const environment = isDev ? 'Dev' : 'Prod';
const domain = isDev ? `${domainPrefix}.getpocket.dev` : `${domainPrefix}.readitlater.com`;
const graphqlVariant = isDev ? 'development' : 'current';
const rds = {
  minCapacity: 1,
  maxCapacity: isDev ? 1 : undefined
}

export const config = {
  name,
  prefix: `${name}-${environment}`,
  circleCIPrefix: `/${name}/CircleCI/${environment}`,
  shortName: 'COLAPI',
  environment,
  domain,
  graphqlVariant,
  rds,
  tags: {
    service: name,
    environment,
  },
};
