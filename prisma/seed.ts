import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const kelvin = await prisma.author.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      name: 'Kelvin',
    },
  });

  const jonathan = await prisma.author.upsert({
    where: { id: '2' },
    update: {},
    create: {
      id: '2',
      name: 'Jonathan',
    },
  });

  console.log({ kelvin, jonathan });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
