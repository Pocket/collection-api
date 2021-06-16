import { CollectionStatus, PrismaClient } from '@prisma/client';
import {
  createAuthorHelper,
  createCollectionHelper,
  createCurationCategoryHelper,
  createIABCategoryHelper,
} from '../src/test/helpers';

const prisma = new PrismaClient();

async function main() {
  const kelvin = await createAuthorHelper(prisma, { name: 'Kelvin' });
  const jonathan = await createAuthorHelper(prisma, { name: 'Jonathan' });
  const chelsea = await createAuthorHelper(prisma, { name: 'Chelsea' });
  const mathijs = await createAuthorHelper(prisma, { name: 'Mathijs' });
  const daniel = await createAuthorHelper(prisma, { name: 'Daniel' });
  const nina = await createAuthorHelper(prisma, { name: 'Nina' });

  const curationCategory1 = await createCurationCategoryHelper(prisma, {
    name: 'Lorem Ipsum',
    slug: 'lorem-ipsum',
  });

  const curationCategory2 = await createCurationCategoryHelper(prisma, {
    name: 'Bowling',
    slug: 'bowling',
  });

  const IABParentCategory = await createIABCategoryHelper(
    prisma,
    'Entertainment'
  );
  const IABChildCategory = await createIABCategoryHelper(
    prisma,
    'Bowling',
    IABParentCategory
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
    IABParentCategory,
    IABChildCategory,
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
    IABParentCategory,
    IABChildCategory,
  });
  await createCollectionHelper(prisma, {
    title: `Chelsea's second collection`,
    author: chelsea,
  });
  await createCollectionHelper(prisma, {
    title: `Daniel's second collection`,
    author: daniel,
    curationCategory: curationCategory2,
    IABParentCategory,
    IABChildCategory,
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
    IABParentCategory,
    IABChildCategory,
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
