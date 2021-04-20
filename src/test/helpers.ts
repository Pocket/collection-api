import slugify from 'slugify';
import {
  Collection,
  CollectionAuthor,
  CollectionStatus,
  PrismaClient,
} from '@prisma/client';
import faker from 'faker';
import config from '../config';

const slugifyConfig = config.slugify;

export async function createAuthorHelper(
  prisma: PrismaClient,
  name
): Promise<CollectionAuthor> {
  const slug = slugify(name, slugifyConfig);
  return await prisma.collectionAuthor.create({
    data: {
      name,
      slug,
    },
  });
}

export async function createCollectionHelper(
  prisma: PrismaClient,
  title: string,
  author: CollectionAuthor,
  status: CollectionStatus = 'draft',
  publishedAt: Date = null
): Promise<Collection> {
  // i would like to type the below with `CollectionCreateInput` but, even
  // though this type is exported in `.prisma/client/index.d.ts`, i cannot
  // import it here :/ (i can import other types in that file though so :shrug:)
  const data: any = {
    title,
    slug: slugify(title, slugifyConfig),
    excerpt: title,
    status,
    authors: {
      connect: {
        id: author.id,
      },
    },
  };

  if (status === CollectionStatus.published && publishedAt) {
    data.publishedAt = publishedAt;
  }

  const collection = await prisma.collection.create({ data });

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

export async function clear(prisma: PrismaClient): Promise<void> {
  const tables = ['CollectionStory', 'Collection', 'CollectionAuthor', 'Image'];

  for (let i = 0; i < tables.length; i++) {
    await prisma.$executeRaw(`DELETE FROM ${tables[i]}`);
  }
}
