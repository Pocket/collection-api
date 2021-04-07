import { Construct } from 'constructs';
import {
  App,
  DataTerraformRemoteState,
  RemoteBackend,
  TerraformStack,
} from 'cdktf';
import {
  AwsProvider,
  DataAwsCallerIdentity,
  DataAwsKmsAlias,
  DataAwsRegion,
  DataAwsSnsTopic,
} from '../.gen/providers/aws';
import { config } from './config';
import {
  ApplicationRedis,
  PocketALBApplication,
  PocketPagerDuty,
  PocketVPC,
} from '@pocket/terraform-modules';
import { PagerdutyProvider } from '../.gen/providers/pagerduty';

class CollectionAPI extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new AwsProvider(this, 'aws', {
      region: 'us-east-1',
    });

    new PagerdutyProvider(this, 'pagerduty_provider', {
      token: undefined,
    });

    new RemoteBackend(this, {
      hostname: 'app.terraform.io',
      organization: 'Pocket',
      workspaces: [
        {
          prefix: `${config.name}-`,
        },
      ],
    });

    const incidentManagement = new DataTerraformRemoteState(
      this,
      'incident_management',
      {
        organization: 'Pocket',
        workspaces: {
          name: 'incident-management',
        },
      }
    );

    const pagerDuty = new PocketPagerDuty(this, 'pagerduty', {
      prefix: config.prefix,
      service: {
        criticalEscalationPolicyId: incidentManagement.get(
          'policy_backend_critical_id'
        ),
        nonCriticalEscalationPolicyId: incidentManagement.get(
          'policy_backend_non_critical_id'
        ),
      },
    });

    const region = new DataAwsRegion(this, 'region');
    const caller = new DataAwsCallerIdentity(this, 'caller');
    const secretsManager = new DataAwsKmsAlias(this, 'kms_alias', {
      name: 'alias/aws/secretsmanager',
    });

    const snsTopic = new DataAwsSnsTopic(this, 'backend_notifications', {
      name: `Backend-${config.environment}-ChatBot`,
    });

    const {
      primaryEndpoint,
      readerEndpoint,
    } = CollectionAPI.createElasticache(this);

    new PocketALBApplication(this, 'application', {
      internal: true,
      prefix: config.prefix,
      alb6CharacterPrefix: config.shortName,
      tags: config.tags,
      cdn: false,
      domain: config.domain,
      containerConfigs: [
        {
          name: 'app',
          hostPort: 4004,
          containerPort: 4004,
          envVars: [
            {
              name: 'ENVIRONMENT',
              value: process.env.NODE_ENV, // this gives us a nice lowercase production and development
            },
            {
              name: 'REDIS_PRIMARY_ENDPOINT',
              value: primaryEndpoint,
            },
            {
              name: 'REDIS_READER_ENDPOINT',
              value: readerEndpoint,
            },
          ],
          secretEnvVars: [
            {
              name: 'SENTRY_DSN',
              valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/SENTRY_DSN`,
            },
          ],
        },
        {
          name: 'xray-daemon',
          containerImage: 'amazon/aws-xray-daemon',
          hostPort: 2000,
          containerPort: 2000,
          protocol: 'udp',
          command: ['--region', 'us-east-1', '--local-mode'],
        },
      ],
      codeDeploy: {
        useCodeDeploy: true,
        snsNotificationTopicArn: snsTopic.arn,
      },
      exposedContainer: {
        name: 'app',
        port: 4002,
        healthCheckPath: '/.well-known/apollo/server-health',
      },
      ecsIamConfig: {
        prefix: config.prefix,
        taskExecutionRolePolicyStatements: [
          //This policy could probably go in the shared module in the future.
          {
            actions: ['secretsmanager:GetSecretValue', 'kms:Decrypt'],
            resources: [
              `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:Shared`,
              `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:Shared/*`,
              secretsManager.targetKeyArn,
            ],
            effect: 'Allow',
          },
          //This policy could probably go in the shared module in the future.
          {
            actions: ['ssm:GetParameter*'],
            resources: [
              `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}`,
              `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/*`,
            ],
            effect: 'Allow',
          },
        ],
        taskRolePolicyStatements: [
          {
            actions: [
              'xray:PutTraceSegments',
              'xray:PutTelemetryRecords',
              'xray:GetSamplingRules',
              'xray:GetSamplingTargets',
              'xray:GetSamplingStatisticSummaries',
            ],
            resources: ['*'],
            effect: 'Allow',
          },
        ],
        taskExecutionDefaultAttachmentArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },

      autoscalingConfig: {
        targetMinCapacity: 2,
        targetMaxCapacity: 10,
      },
      alarms: {
        //TODO: When we start using this more we will change from non-critical to critical
        http5xxError: {
          threshold: 10,
          evaluationPeriods: 2,
          period: 600,
          actions: [pagerDuty.snsNonCriticalAlarmTopic.arn],
        },
        httpLatency: {
          evaluationPeriods: 2,
          threshold: 500,
          actions: [pagerDuty.snsNonCriticalAlarmTopic.arn],
        },
        httpRequestCount: {
          threshold: 5000,
          evaluationPeriods: 2,
          actions: [pagerDuty.snsNonCriticalAlarmTopic.arn],
        },
      },
    });
  }

  /**
   * Creates the elasticache and returns the node address list
   * @param scope
   * @private
   */
  private static createElasticache(
    scope: Construct
  ): { primaryEndpoint: string; readerEndpoint: string } {
    const pocketVPC = new PocketVPC(scope, 'pocket-vpc');

    const elasticache = new ApplicationRedis(scope, 'redis', {
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
      subnetIds: pocketVPC.privateSubnetIds,
      tags: config.tags,
      vpcId: pocketVPC.vpc.id,
      prefix: config.prefix,
    });

    return {
      primaryEndpoint:
        elasticache.elasticacheReplicationGroup.primaryEndpointAddress,
      readerEndpoint:
        elasticache.elasticacheReplicationGroup.readerEndpointAddress,
    };
  }
}

const app = new App();
new CollectionAPI(app, 'collection-api');
app.synth();
