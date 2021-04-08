import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // const kelvin = await prisma.author.upsert({
  //   where: { id: '1234-5678' },
  //   update: {},
  //   create: {
  //     id: '1234-5678',
  //     name: 'Kelvin',
  //   },
  // });

  const kelvin = await prisma.author.create({
    data: {
      id: '1234-5678',
      name: 'Kelvin',
    }
  });
  // const jonathan = await prisma.author.upsert({
  //   where: { id: '0987-6542' },
  //   update: {},
  //   create: {
  //     id: '0987-6542',
  //     name: 'Jonathan',
  //   },
  // });

  // console.log({ kelvin, jonathan });
  console.log({ kelvin });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
