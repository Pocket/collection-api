import {
  ApplicationRDSCluster,
  PocketALBApplication,
  PocketPagerDuty,
} from '@pocket/terraform-modules';
import { config } from './config';
import { Construct } from 'constructs';
import { DataTerraformRemoteState } from 'cdktf';
import {
  DataAwsCallerIdentity,
  DataAwsKmsAlias,
  DataAwsRegion,
  DataAwsSnsTopic,
  S3Bucket,
} from '../.gen/providers/aws';

/**
 * @param scope
 */
function createPagerDuty(scope: Construct) {
  const incidentManagement = new DataTerraformRemoteState(
    scope,
    'incident_management',
    {
      organization: 'Pocket',
      workspaces: {
        name: 'incident-management',
      },
    }
  );

  return new PocketPagerDuty(scope, 'pagerduty', {
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
}

/**
 * @param scope
 * @param dependencies
 */
export function createPocketAlbApplication(
  scope: Construct,
  dependencies: { rds: ApplicationRDSCluster; s3: S3Bucket }
): void {
  const { rds, s3 } = dependencies;

  const pagerDuty = createPagerDuty(scope);

  const region = new DataAwsRegion(scope, 'region');
  const caller = new DataAwsCallerIdentity(scope, 'caller');
  const secretsManager = new DataAwsKmsAlias(scope, 'kms_alias', {
    name: 'alias/aws/secretsmanager',
  });

  const snsTopic = new DataAwsSnsTopic(scope, 'backend_notifications', {
    name: `Backend-${config.environment}-ChatBot`,
  });

  new PocketALBApplication(scope, 'application', {
    internal: true,
    prefix: config.prefix,
    alb6CharacterPrefix: config.shortName,
    tags: config.tags,
    cdn: false,
    domain: config.domain,
    containerConfigs: [
      {
        name: 'app',
        portMappings: [
          {
            hostPort: 4004,
            containerPort: 4004,
          },
        ],
        healthCheck: {
          command: [
            'CMD-SHELL',
            'curl -f http://localhost:4004/.well-known/apollo/server-health || exit 1',
          ],
          interval: 15,
          retries: 3,
          timeout: 5,
          startPeriod: 0,
        },
        envVars: [
          {
            name: 'NODE_ENV',
            value: process.env.NODE_ENV, // this gives us a nice lowercase production and development
          },
          {
            name: 'AWS_S3_BUCKET',
            value: process.env.AWS_S3_BUCKET,
          },
        ],
        secretEnvVars: [
          {
            name: 'SENTRY_DSN',
            valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/SENTRY_DSN`,
          },
          {
            name: 'DATABASE_URL',
            valueFrom: `${rds.secretARN}:database_url::`,
          },
        ],
      },
      {
        name: 'xray-daemon',
        containerImage: 'amazon/aws-xray-daemon',
        repositoryCredentialsParam: `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:Shared/DockerHub`,
        portMappings: [
          {
            hostPort: 2000,
            containerPort: 2000,
            protocol: 'udp',
          },
        ],
        command: ['--region', 'us-east-1', '--local-mode'],
      },
    ],
    codeDeploy: {
      useCodeDeploy: true,
      snsNotificationTopicArn: snsTopic.arn,
    },
    exposedContainer: {
      name: 'app',
      port: 4004,
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
            `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.name}/${config.environment}`,
            `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.name}/${config.environment}/*`,
            `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.prefix}`,
            `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.prefix}/*`,
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
        {
          actions: ['s3:*'],
          resources: [`arn:aws:s3:::${s3.id}`, `arn:aws:s3:::${s3.id}/*`],
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
