import slugify from 'slugify';
import {
  Collection,
  CollectionAuthor,
  CollectionStatus,
  CollectionStory,
  Image,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import faker from 'faker';
import config from '../config';

const slugifyConfig = config.slugify;

export async function createAuthorHelper(
  prisma: PrismaClient,
  name: string,
  imageUrl: string = null
): Promise<CollectionAuthor> {
  const slug = slugify(name, slugifyConfig);

  const data: Prisma.CollectionAuthorCreateInput = { name, slug };

  if (imageUrl) data.imageUrl = imageUrl;

  return await prisma.collectionAuthor.create({ data });
}

export async function createCollectionHelper(
  prisma: PrismaClient,
  title: string,
  author: CollectionAuthor,
  status: CollectionStatus = 'DRAFT',
  publishedAt: Date = null,
  imageUrl: string = null,
  addStories = true
): Promise<Collection> {
  const data: Prisma.CollectionCreateInput = {
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

  if (status === CollectionStatus.PUBLISHED && publishedAt) {
    data.publishedAt = publishedAt;
  }

  if (imageUrl) {
    data.imageUrl = imageUrl;
  }

  const collection = await prisma.collection.create({ data });

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
  }

  if (addStories) {
    for (let i = 0; i < getRandomInt(2, 6); i++) {
      await createCollectionStoryHelper(
        prisma,
        collection.id,
        faker.internet.url(),
        faker.lorem.sentence(),
        faker.lorem.paragraph(),
        imageUrl || faker.image.imageUrl(),
        [
          { name: `${faker.name.firstName()} ${faker.name.lastName()}` },
          { name: `${faker.name.firstName()} ${faker.name.lastName()}` },
        ],
        faker.company.companyName()
      );
    }
  }

  return collection;
}

export async function createCollectionStoryHelper(
  prisma: PrismaClient,
  collectionId: number,
  url: string,
  title: string,
  excerpt: string,
  imageUrl: string,
  authors: { name: string }[],
  publisher: string,
  sortOrder?: number
): Promise<CollectionStory> {
  const data: any = {
    collectionId,
    url,
    title,
    excerpt,
    imageUrl,
    authors: JSON.stringify(authors),
    publisher,
  };

  if (sortOrder) {
    data.sortOrder = sortOrder;
  }

  return await prisma.collectionStory.create({
    data,
  });
}

export async function createImageHelper(
  prisma: PrismaClient,
  fileName: string,
  mimeType: string,
  fileSizeBytes: number,
  width: number,
  height: number,
  path: string
): Promise<Image> {
  return prisma.image.create({
    data: {
      fileName,
      width,
      height,
      path,
      mimeType,
      fileSizeBytes,
    },
  });
}

export async function clear(prisma: PrismaClient): Promise<void> {
  const tables = ['CollectionStory', 'Collection', 'CollectionAuthor', 'Image'];

  for (let i = 0; i < tables.length; i++) {
    await prisma.$executeRaw(`DELETE FROM ${tables[i]}`);
  }
}
