import { collections_status, PrismaClient } from '@prisma/client';
import slugify from 'slugify';
import faker from 'faker';

const prisma = new PrismaClient();

const slugifyConfig = { lower: true, remove: /[*+~.()'"!:@]/g };

async function createAuthor(id, name) {
  const slug = slugify(name, slugifyConfig);
  return await prisma.authors.upsert({
    where: { id },
    update: {},
    create: {
      id,
      name,
      slug,
    },
  });
}

async function createStory(id, url) {
  return await prisma.stories.upsert({
    where: { id },
    update: {},
    create: {
      id,
      url,
    },
  });
}

async function createCollection(
  id,
  title,
  storyIds: number[],
  status: collections_status = 'draft'
) {
  const collection = await prisma.collections.upsert({
    where: { id },
    update: {
      status,
    },
    create: {
      id,
      title,
      slug: slugify(title, slugifyConfig),
      status,
    },
  });

  for (let i = 0; i < storyIds.length; i++) {
    const storyId = storyIds[i];
    await prisma.collection_story.create({
      data: {
        collectionId: collection.id,
        storyId,
        title: faker.lorem.sentence(),
        excerpt: faker.lorem.paragraph(),
        imageUrl: faker.image.imageUrl(),
        authors: JSON.stringify([
          `${faker.firstName} ${faker.lastName}`,
          `${faker.firstName} ${faker.lastName}`,
        ]),
        publisher: faker.company.companyName(),
      },
    });
  }

  return collection;
}

async function createCollectionAuthor(collectionId: number, authorId: number) {
  return await prisma.collection_author.upsert({
    where: { collectionId_authorId: { collectionId, authorId } },
    update: {},
    create: {
      collectionId,
      authorId,
    },
  });
}

async function main() {
  const kelvin = await createAuthor(1, 'Kelvin');
  const jonathan = await createAuthor(2, 'Jonathan');
  const chelsea = await createAuthor(3, 'Chelsea');
  const mathijs = await createAuthor(4, 'Mathijs');
  const daniel = await createAuthor(5, 'Daniel');
  const nina = await createAuthor(6, 'Nina');

  for (let i = 0; i < 10; i++) {
    await createStory(i + 1, faker.internet.url());
  }

  const collection1 = await createCollection(1, `Kelvin's first collection`, [
    1,
    2,
  ]);
  const collection2 = await createCollection(
    2,
    `Daniel's first collection`,
    [3, 4],
    'published'
  );
  const collection3 = await createCollection(3, `Nina's first collection`, [
    5,
    6,
  ]);
  const collection4 = await createCollection(4, `Chelsea's first collection`, [
    7,
    8,
  ]);
  const collection5 = await createCollection(
    5,
    `Mathijs's' first collection`,
    [9, 10],
    'published'
  );
  const collection6 = await createCollection(
    6,
    `Jonathan's' first collection`,
    [1, 2]
  );
  const collection7 = await createCollection(7, `Chelsea's second collection`, [
    3,
    4,
  ]);
  const collection8 = await createCollection(8, `Daniel's second collection`, [
    5,
    6,
  ]);
  const collection9 = await createCollection(
    9,
    `Jonathan's second collection`,
    [7, 8]
  );
  const collection10 = await createCollection(
    10,
    `Chelsea's' third collection`,
    [9, 10],
    'archived'
  );

  await createCollectionAuthor(collection1.id, kelvin.id);
  await createCollectionAuthor(collection2.id, daniel.id);
  await createCollectionAuthor(collection3.id, nina.id);
  await createCollectionAuthor(collection4.id, chelsea.id);
  await createCollectionAuthor(collection5.id, mathijs.id);
  await createCollectionAuthor(collection6.id, jonathan.id);
  await createCollectionAuthor(collection7.id, chelsea.id);
  await createCollectionAuthor(collection8.id, daniel.id);
  await createCollectionAuthor(collection9.id, jonathan.id);
  await createCollectionAuthor(collection10.id, chelsea.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
