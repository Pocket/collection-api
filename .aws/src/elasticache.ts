import { Construct } from 'constructs';
import { ApplicationRedis, PocketVPC } from '@pocket/terraform-modules';
import { config } from './config';

/**
 * Creates the elasticache and returns the node address list
 * @param scope
 * @param vpc
 * @private
 */
export function createElasticache(scope: Construct, vpc: PocketVPC): ApplicationRedis {
  return new ApplicationRedis(scope, 'redis', {
    //Usually we would set the security group ids of the service that needs to hit this.
    //However we don't have the necessary security group because it gets created in PocketALBApplication
    //So instead we set it to null and allow anything within the vpc to access it.
    //This is not ideal..
    //Ideally we need to be able to add security groups to the ALB application.
    allowedIngressSecurityGroupIds: undefined,
    node: {
      count: config.cacheNodes,
      size: config.cacheSize,
    },
    subnetIds: vpc.privateSubnetIds,
    tags: config.tags,
    vpcId: vpc.vpc.id,
    prefix: config.prefix,
  });
}
