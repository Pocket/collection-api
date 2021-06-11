import slugify from 'slugify';
import {
  Collection,
  CollectionAuthor,
  CollectionStatus,
  CollectionStory,
  CurationCategory,
  Image,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import {
  CollectionStoryAuthor,
  CreateCollectionAuthorInput,
  CreateCollectionStoryInput,
} from '../database/types';
import faker from 'faker';
import config from '../config';

const slugifyConfig = config.slugify;

export async function createAuthorHelper(
  prisma: PrismaClient,
  author: CreateCollectionAuthorInput
): Promise<CollectionAuthor> {
  if (!author.slug) {
    author.slug = slugify(author.name, slugifyConfig);
  }

  return await prisma.collectionAuthor.create({ data: author });
}

export async function createCollectionHelper(
  prisma: PrismaClient,
  title: string,
  author: CollectionAuthor,
  status: CollectionStatus = 'DRAFT',
  curationCategory: CurationCategory = null,
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

  if (curationCategory) {
    data.curationCategory = { connect: { id: curationCategory.id } };
  }

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
      await createCollectionStoryHelper(prisma, {
        collectionId: collection.id,
        url: faker.internet.url(),
        title: faker.lorem.sentence(),
        excerpt: faker.lorem.paragraph(),
        imageUrl: imageUrl || faker.image.imageUrl(),
        authors: [
          {
            name: `${faker.name.firstName()} ${faker.name.lastName()}`,
            sortOrder: faker.datatype.number(),
          },
          {
            name: `${faker.name.firstName()} ${faker.name.lastName()}`,
            sortOrder: faker.datatype.number(),
          },
        ],
        publisher: faker.company.companyName(),
      });
    }
  }

  return collection;
}

export async function createCollectionStoryHelper(
  prisma: PrismaClient,
  collectionStory: {
    collectionId: number;
  } & Omit<CreateCollectionStoryInput, 'collectionExternalId'>
): Promise<CollectionStory> {
  const data: any = collectionStory;
  data.authors = {
    create: collectionStory.authors,
  };

  return await prisma.collectionStory.create({
    data,
  });
}

export async function createCurationCategoryHelper(
  prisma: PrismaClient,
  curationCategory: CreateCurationCategoryInput
): Promise<CurationCategory> {
  return await prisma.curationCategory.create({ data: curationCategory });
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
  const tables = [
    'CollectionStory',
    'CurationCategory',
    'Collection',
    'CollectionAuthor',
    'Image',
  ];

  for (let i = 0; i < tables.length; i++) {
    await prisma.$executeRaw(`DELETE FROM ${tables[i]}`);
  }
}

export function sortCollectionStoryAuthors(
  authors: CollectionStoryAuthor[]
): CollectionStoryAuthor[] {
  // manually sort the authors of the first story by their `sortOrder`
  // property
  return authors.sort((a, b) => {
    // this coerces the sort function to treat sortOrder as a number and not
    // a string. oh javascript.
    return a.sortOrder - b.sortOrder;
  });
}

/**
 * The minimum information required to create a curation category
 */
export type CreateCurationCategoryInput = {
  name: string;
  slug: string;
};
