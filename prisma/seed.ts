import {
  CollectionStatus,
  CollectionPartnershipType,
  PrismaClient,
} from '@prisma/client';
import { CollectionLanguage } from '../src/database/types';
import {
  createAuthorHelper,
  createCollectionHelper,
  createCollectionPartnerAssociationHelper,
  createCurationCategoryHelper,
  createLabelHelper,
  createIABCategoryHelper,
  createPartnerHelper,
} from '../src/test/helpers';

const prisma = new PrismaClient();

async function main() {
  const kelvin = await createAuthorHelper(prisma, 'Kelvin');
  const jonathan = await createAuthorHelper(prisma, 'Jonathan');
  const chelsea = await createAuthorHelper(prisma, 'Chelsea');
  const mathijs = await createAuthorHelper(prisma, 'Mathijs');
  const daniel = await createAuthorHelper(prisma, 'Daniel');
  const nina = await createAuthorHelper(prisma, 'Nina');

  //create Label
  await createLabelHelper(
    prisma,
    'East Africa',
    'kchinnappan'
    );
  await createLabelHelper(
    prisma
    );

  const curationCategory1 = await createCurationCategoryHelper(
    prisma,
    'Lorem Ipsum'
  );

  const curationCategory2 = await createCurationCategoryHelper(
    prisma,
    'Bowling'
  );

  const IABParentCategory = await createIABCategoryHelper(
    prisma,
    'Entertainment'
  );

  const IABChildCategory = await createIABCategoryHelper(
    prisma,
    'Live Music',
    IABParentCategory
  );

  const collection1 = await createCollectionHelper(prisma, {
    title: `Kelvin's first collection`,
    author: kelvin,
    curationCategory: curationCategory1,
  });
  const collection2 = await createCollectionHelper(prisma, {
    title: `Daniel's first collection`,
    author: daniel,
    status: CollectionStatus.PUBLISHED,
    publishedAt: new Date(),
    language: CollectionLanguage.DE,
    IABParentCategory,
    IABChildCategory,
  });
  const collection3 = await createCollectionHelper(prisma, {
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
    title: `Nina's second collection`,
    author: nina,
    curationCategory: curationCategory2,
    status: CollectionStatus.REVIEW,
  });
  await createCollectionHelper(prisma, {
    title: `Mathijs's' second collection`,
    author: mathijs,
    status: CollectionStatus.REVIEW,
    publishedAt: new Date(),
  });
  await createCollectionHelper(prisma, {
    title: `Chelsea's' third collection`,
    author: chelsea,
    status: CollectionStatus.ARCHIVED,
    IABParentCategory,
    IABChildCategory,
  });
  await createCollectionHelper(prisma, {
    title: `Jonathan's third collection`,
    author: jonathan,
    curationCategory: curationCategory1,
    status: CollectionStatus.PUBLISHED,
    publishedAt: new Date(),
    language: CollectionLanguage.DE,
  });

  const partner1 = await createPartnerHelper(prisma, 'Wellness Storm');
  const partner2 = await createPartnerHelper(prisma, 'Urban Craft Blockchain');
  await createPartnerHelper(prisma, 'Martial Power Cycling');
  await createPartnerHelper(prisma, 'Dollar Rabbit Fund');
  await createPartnerHelper(prisma, 'Alpine Octopus');

  await createCollectionPartnerAssociationHelper(prisma, {
    type: CollectionPartnershipType.PARTNERED,
    collection: collection1,
    partner: partner1,
  });

  await createCollectionPartnerAssociationHelper(prisma, {
    collection: collection2,
    partner: partner2,
  });

  await createCollectionPartnerAssociationHelper(prisma, {
    collection: collection3,
    partner: partner2,
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
