import { CollectionStatus, PrismaClient } from '@prisma/client';
import {
  createAuthorHelper,
  createCollectionHelper,
  createCurationCategoryHelper,
  createIABCategoryHelper,
} from '../src/test/helpers';

const prisma = new PrismaClient();

async function main() {
  const kelvin = await createAuthorHelper(prisma, 'Kelvin');
  const jonathan = await createAuthorHelper(prisma, 'Jonathan');
  const chelsea = await createAuthorHelper(prisma, 'Chelsea');
  const mathijs = await createAuthorHelper(prisma, 'Mathijs');
  const daniel = await createAuthorHelper(prisma, 'Daniel');
  const nina = await createAuthorHelper(prisma, 'Nina');

  const curationCategory1 = await createCurationCategoryHelper(
    prisma,
    'Lorem Ipsum'
  );

  const curationCategory2 = await createCurationCategoryHelper(
    prisma,
    'Bowling'
  );

  const IABTopCategory = await createIABCategoryHelper(prisma, 'Entertainment');
  const IABSubCategory = await createIABCategoryHelper(
    prisma,
    'Bowling',
    IABTopCategory
  );

  await createCollectionHelper(prisma, {
    title: `Kelvin's first collection`,
    author: kelvin,
    curationCategory: curationCategory1,
  });
  await createCollectionHelper(prisma, {
    title: `Daniel's first collection`,
    author: daniel,
    status: CollectionStatus.PUBLISHED,
    publishedAt: new Date(),
    IABTopCategory,
    IABSubCategory,
  });
  await createCollectionHelper(prisma, {
    title: `Nina's first collection`,
    author: nina,
    curationCategory: curationCategory2,
  });
  await createCollectionHelper(prisma, {
    title: `Chelsea's first collection`,
    author: chelsea,
    curationCategory: curationCategory1,
  });
  await createCollectionHelper(prisma, {
    title: `Mathijs's' first collection`,
    author: mathijs,
    status: CollectionStatus.PUBLISHED,
    publishedAt: new Date(),
  });
  await createCollectionHelper(prisma, {
    title: `Jonathan's' first collection`,
    author: jonathan,
    curationCategory: curationCategory2,
    IABTopCategory,
    IABSubCategory,
  });
  await createCollectionHelper(prisma, {
    title: `Chelsea's second collection`,
    author: chelsea,
  });
  await createCollectionHelper(prisma, {
    title: `Daniel's second collection`,
    author: daniel,
    curationCategory: curationCategory2,
    IABTopCategory,
    IABSubCategory,
  });
  await createCollectionHelper(prisma, {
    title: `Jonathan's second collection`,
    author: jonathan,
    curationCategory: curationCategory1,
  });
  await createCollectionHelper(prisma, {
    title: `Chelsea's' third collection`,
    author: chelsea,
    status: CollectionStatus.ARCHIVED,
    IABTopCategory,
    IABSubCategory,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
