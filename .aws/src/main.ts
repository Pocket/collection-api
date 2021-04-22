import { Construct } from 'constructs';
import { App, RemoteBackend, TerraformStack } from 'cdktf';
import { AwsProvider, S3Bucket } from '../.gen/providers/aws';
import { config } from './config';
import { PocketVPC } from '@pocket/terraform-modules';
import { PagerdutyProvider } from '../.gen/providers/pagerduty';
import { createRds } from './rds';
import { createPocketAlbApplication } from './pocketAlbApplication';

class CollectionAPI extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new AwsProvider(this, 'aws', { region: 'us-east-1' });

    new PagerdutyProvider(this, 'pagerduty_provider', { token: undefined });

    new RemoteBackend(this, {
      hostname: 'app.terraform.io',
      organization: 'Pocket',
      workspaces: [{ prefix: `${config.name}-` }],
    });

    const pocketVpc = new PocketVPC(this, 'pocket-vpc');

    const rds = createRds(this, pocketVpc);

    const s3 = new S3Bucket(this, 'image-uploads', {
      bucket: `pocket-${config.prefix.toLowerCase()}-images`,
    });

    createPocketAlbApplication(this, { rds, s3 });
  }
}

const app = new App();
new CollectionAPI(app, 'collection-api');
app.synth();
