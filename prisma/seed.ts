import { PrismaClient } from '@prisma/client';
import {createAuthor, createCollection} from "../src/test/helpers";

const prisma = new PrismaClient();

async function main() {
  const kelvin = await createAuthor(prisma, 1, 'Kelvin');
  const jonathan = await createAuthor(prisma, 2, 'Jonathan');
  const chelsea = await createAuthor(prisma, 3, 'Chelsea');
  const mathijs = await createAuthor(prisma, 4, 'Mathijs');
  const daniel = await createAuthor(prisma, 5, 'Daniel');
  const nina = await createAuthor(prisma, 6, 'Nina');

  const collection1 = await createCollection(
    prisma,
    `Kelvin's first collection`,
    kelvin
  );
  const collection2 = await createCollection(
    prisma,
    `Daniel's first collection`,
    daniel,
    'published'
  );
  const collection3 = await createCollection(
    prisma,
    `Nina's first collection`,
    nina
  );
  const collection4 = await createCollection(
    prisma,
    `Chelsea's first collection`,
    chelsea
  );
  const collection5 = await createCollection(
    prisma,
    `Mathijs's' first collection`,
    mathijs,
    'published'
  );
  const collection6 = await createCollection(
    prisma,
    `Jonathan's' first collection`,
    jonathan
  );
  const collection7 = await createCollection(
    prisma,
    `Chelsea's second collection`,
    chelsea
  );
  const collection8 = await createCollection(
    prisma,
    `Daniel's second collection`,
    daniel
  );
  const collection9 = await createCollection(
    prisma,
    `Jonathan's second collection`,
    jonathan
  );
  const collection10 = await createCollection(
    prisma,
    `Chelsea's' third collection`,
    chelsea,
    'archived'
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
