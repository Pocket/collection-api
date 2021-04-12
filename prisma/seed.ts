import { Author, CollectionStatus, PrismaClient } from '@prisma/client';
import slugify from 'slugify';
import faker from 'faker';

const prisma = new PrismaClient();

const slugifyConfig = { lower: true, remove: /[*+~.()'"!:@]/g };

async function createAuthor(id, name) {
  const slug = slugify(name, slugifyConfig);
  return await prisma.author.upsert({
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
  return await prisma.story.upsert({
    where: { id },
    update: {},
    create: {
      id,
      url,
    },
  });
}

async function createCollection(
  title,
  storyIds: number[],
  author: Author,
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

  for (let i = 0; i < storyIds.length; i++) {
    const storyId = storyIds[i];
    await prisma.collectionStory.create({
      data: {
        collectionId: collection.id,
        storyId,
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

  const collection1 = await createCollection(
    `Kelvin's first collection`,
    [1, 2],
    kelvin
  );
  const collection2 = await createCollection(
    `Daniel's first collection`,
    [3, 4],
    daniel,
    'published'
  );
  const collection3 = await createCollection(
    `Nina's first collection`,
    [5, 6],
    nina
  );
  const collection4 = await createCollection(
    `Chelsea's first collection`,
    [7, 8],
    chelsea
  );
  const collection5 = await createCollection(
    `Mathijs's' first collection`,
    [9, 10],
    mathijs,
    'published'
  );
  const collection6 = await createCollection(
    `Jonathan's' first collection`,
    [1, 2],
    jonathan
  );
  const collection7 = await createCollection(
    `Chelsea's second collection`,
    [3, 4],
    chelsea
  );
  const collection8 = await createCollection(
    `Daniel's second collection`,
    [5, 6],
    daniel
  );
  const collection9 = await createCollection(
    `Jonathan's second collection`,
    [7, 8],
    jonathan
  );
  const collection10 = await createCollection(
    `Chelsea's' third collection`,
    [9, 10],
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
