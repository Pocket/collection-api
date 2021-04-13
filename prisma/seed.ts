import { PrismaClient } from '@prisma/client';
import { createAuthor, createCollection } from '../src/test/helpers';

const prisma = new PrismaClient();

async function main() {
  const kelvin = await createAuthor(prisma, 1, 'Kelvin');
  const jonathan = await createAuthor(prisma, 2, 'Jonathan');
  const chelsea = await createAuthor(prisma, 3, 'Chelsea');
  const mathijs = await createAuthor(prisma, 4, 'Mathijs');
  const daniel = await createAuthor(prisma, 5, 'Daniel');
  const nina = await createAuthor(prisma, 6, 'Nina');

  await createCollection(prisma, `Kelvin's first collection`, kelvin);
  await createCollection(
    prisma,
    `Daniel's first collection`,
    daniel,
    'published'
  );
  await createCollection(prisma, `Nina's first collection`, nina);
  await createCollection(prisma, `Chelsea's first collection`, chelsea);
  await createCollection(
    prisma,
    `Mathijs's' first collection`,
    mathijs,
    'published'
  );
  await createCollection(prisma, `Jonathan's' first collection`, jonathan);
  await createCollection(prisma, `Chelsea's second collection`, chelsea);
  await createCollection(prisma, `Daniel's second collection`, daniel);
  await createCollection(prisma, `Jonathan's second collection`, jonathan);
  await createCollection(
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
