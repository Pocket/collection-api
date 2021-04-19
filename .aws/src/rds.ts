import { Construct } from 'constructs';
import { ApplicationRDSCluster, PocketVPC } from '@pocket/terraform-modules';
import { config } from './config';

export function createRds(scope: Construct, pocketVpc: PocketVPC) {
  return new ApplicationRDSCluster(scope, 'rds', {
    prefix: config.prefix,
    vpcId: pocketVpc.vpc.id,
    subnetIds: pocketVpc.privateSubnetIds,
    rdsConfig: {
      databaseName: 'collections',
      masterUsername: 'pkt_collections',
      engine: 'aurora-mysql',
      engineMode: 'serverless',
      scalingConfiguration: [
        {
          minCapacity: config.rds.minCapacity,
          maxCapacity: config.rds.maxCapacity,
        },
      ],
    },

    tags: config.tags,
  });
}
