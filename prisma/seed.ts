import { CollectionStatus, PrismaClient } from '@prisma/client';
import {
  createAuthorHelper,
  createCollectionHelper,
} from '../src/test/helpers';

const prisma = new PrismaClient();

async function main() {
  const kelvin = await createAuthorHelper(prisma, 'Kelvin');
  const jonathan = await createAuthorHelper(prisma, 'Jonathan');
  const chelsea = await createAuthorHelper(prisma, 'Chelsea');
  const mathijs = await createAuthorHelper(prisma, 'Mathijs');
  const daniel = await createAuthorHelper(prisma, 'Daniel');
  const nina = await createAuthorHelper(prisma, 'Nina');

  await createCollectionHelper(prisma, `Kelvin's first collection`, kelvin);
  await createCollectionHelper(
    prisma,
    `Daniel's first collection`,
    daniel,
    CollectionStatus.PUBLISHED,
    new Date()
  );
  await createCollectionHelper(prisma, `Nina's first collection`, nina);
  await createCollectionHelper(prisma, `Chelsea's first collection`, chelsea);
  await createCollectionHelper(
    prisma,
    `Mathijs's' first collection`,
    mathijs,
    CollectionStatus.PUBLISHED,
    new Date()
  );
  await createCollectionHelper(
    prisma,
    `Jonathan's' first collection`,
    jonathan
  );
  await createCollectionHelper(prisma, `Chelsea's second collection`, chelsea);
  await createCollectionHelper(prisma, `Daniel's second collection`, daniel);
  await createCollectionHelper(
    prisma,
    `Jonathan's second collection`,
    jonathan
  );
  await createCollectionHelper(
    prisma,
    `Chelsea's' third collection`,
    chelsea,
    CollectionStatus.ARCHIVED
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
