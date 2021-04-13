import slugify from 'slugify';
import {
  CollectionAuthor,
  CollectionStatus,
  PrismaClient,
} from '@prisma/client';
import faker from 'faker';

const slugifyConfig = { lower: true, remove: /[*+~.()'"!:@]/g };

export async function createAuthor(prisma: PrismaClient, id, name) {
  const slug = slugify(name, slugifyConfig);
  return await prisma.collectionAuthor.upsert({
    where: { id },
    update: {},
    create: {
      id,
      name,
      slug,
    },
  });
}

export async function createCollection(
  prisma: PrismaClient,
  title,
  author: CollectionAuthor,
  status: CollectionStatus = 'draft'
) {
  const collection = await prisma.collection.create({
    data: {
      title,
      slug: slugify(title, slugifyConfig),
      excerpt: title,
      status,
      authors: {
        connect: {
          id: author.id,
        },
      },
    },
  });

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
  }

  for (let i = 0; i < getRandomInt(2, 6); i++) {
    await prisma.collectionStory.create({
      data: {
        collectionId: collection.id,
        url: faker.internet.url(),
        title: faker.lorem.sentence(),
        excerpt: faker.lorem.paragraph(),
        imageUrl: faker.image.imageUrl(),
        authors: JSON.stringify([
          { name: `${faker.name.firstName()} ${faker.name.lastName()}` },
          { name: `${faker.name.firstName()} ${faker.name.lastName()}` },
        ]),
        publisher: faker.company.companyName(),
      },
    });
  }

  return collection;
}

export async function clear(prisma: PrismaClient) {
  ['CollectionStory', 'Collection', 'CollectionAuthor', 'Image'].map(
    async (table) => await prisma.$executeRaw(`DELETE FROM ${table};`)
  );
}
