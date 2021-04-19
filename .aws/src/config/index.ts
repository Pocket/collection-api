const name = 'CollectionAPI';
const domainPrefix = 'collection-api';
const isDev = process.env.NODE_ENV === 'development';
const environment = isDev ? 'Dev' : 'Prod';
const domain = isDev ? `${domainPrefix}.getpocket.dev` : `${domainPrefix}.readitlater.com`;
const graphqlVariant = isDev ? 'development' : 'current';
//Arbitrary size and count for cache. No logic was used in deciding this.
const cacheNodes = 2;
const cacheSize = isDev ? 'cache.t2.micro' : 'cache.t3.medium';
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
  cacheNodes,
  cacheSize,
  rds,
  tags: {
    service: name,
    environment,
  },
};
