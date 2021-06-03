import { CollectionStatus, PrismaClient } from '@prisma/client';
import {
  createAuthorHelper,
  createCollectionHelper,
  createCurationCategoryHelper,
} from '../src/test/helpers';

const prisma = new PrismaClient();

async function main() {
  const kelvin = await createAuthorHelper(prisma, 'Kelvin');
  const jonathan = await createAuthorHelper(prisma, 'Jonathan');
  const chelsea = await createAuthorHelper(prisma, 'Chelsea');
  const mathijs = await createAuthorHelper(prisma, 'Mathijs');
  const daniel = await createAuthorHelper(prisma, 'Daniel');
  const nina = await createAuthorHelper(prisma, 'Nina');

  const curationCategory = await createCurationCategoryHelper(
    prisma,
    'Lorem Ipsum'
  );

  await createCollectionHelper(
    prisma,
    `Kelvin's first collection`,
    kelvin,
    CollectionStatus.DRAFT,
    curationCategory
  );
  await createCollectionHelper(
    prisma,
    `Daniel's first collection`,
    daniel,
    CollectionStatus.PUBLISHED,
    curationCategory,
    new Date()
  );
  await createCollectionHelper(
    prisma,
    `Nina's first collection`,
    nina,
    CollectionStatus.DRAFT,
    curationCategory
  );
  await createCollectionHelper(
    prisma,
    `Chelsea's first collection`,
    chelsea,
    CollectionStatus.DRAFT,
    curationCategory
  );
  await createCollectionHelper(
    prisma,
    `Mathijs's' first collection`,
    mathijs,
    CollectionStatus.PUBLISHED,
    curationCategory,
    new Date()
  );
  await createCollectionHelper(
    prisma,
    `Jonathan's' first collection`,
    jonathan,
    CollectionStatus.DRAFT,
    curationCategory
  );
  await createCollectionHelper(
    prisma,
    `Chelsea's second collection`,
    chelsea,
    CollectionStatus.DRAFT,
    curationCategory
  );
  await createCollectionHelper(
    prisma,
    `Daniel's second collection`,
    daniel,
    CollectionStatus.DRAFT,
    curationCategory
  );
  await createCollectionHelper(
    prisma,
    `Jonathan's second collection`,
    jonathan,
    CollectionStatus.DRAFT,
    curationCategory
  );
  await createCollectionHelper(
    prisma,
    `Chelsea's' third collection`,
    chelsea,
    CollectionStatus.ARCHIVED,
    curationCategory
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
