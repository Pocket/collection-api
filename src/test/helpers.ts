import slugify from 'slugify';
import {
  Collection,
  CollectionAuthor,
  CollectionStatus,
  CollectionStory,
  CurationCategory,
  IABCategory,
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

// the minimum information required to create a collection
export interface createCollectionHelperRequiredInput {
  title: string;
  author: CollectionAuthor;
}

// optional information you can provide when creating a collection
export interface createCollectionHelperOptionalInput {
  status?: CollectionStatus;
  curationCategory?: CurationCategory;
  publishedAt?: Date;
  imageUrl?: string;
  addStories?: boolean;
  IABParentCategory?: IABCategory;
  IABChildCategory?: IABCategory;
}

// the input for the `createCollectionHelper` function is a combo of the
// required and optional properties
export type createCollectionHelperInput = createCollectionHelperRequiredInput &
  createCollectionHelperOptionalInput;

// the assumed defaults for the optional properties if not specified
const createCollectionHelperDefaults: createCollectionHelperOptionalInput = {
  status: 'DRAFT',
  addStories: true,
  curationCategory: null,
  publishedAt: null,
  imageUrl: null,
  IABParentCategory: null,
  IABChildCategory: null,
};

export async function createCollectionHelper(
  prisma: PrismaClient,
  params: createCollectionHelperInput
): Promise<Collection> {
  // start with defaults and override with any user-provided values
  const mergedParams: createCollectionHelperInput = Object.assign(
    {}, // start with an empty object
    createCollectionHelperDefaults, // add in all defaults
    params // add all specified params, which can/may override defaults
  );

  const {
    title,
    author,
    status,
    curationCategory,
    publishedAt,
    imageUrl,
    addStories,
    IABParentCategory,
    IABChildCategory,
  } = mergedParams;

  const data: Prisma.CollectionCreateInput = {
    title,
    slug: slugify(title, slugifyConfig),
    excerpt: faker.lorem.sentences(2),
    intro: faker.lorem.paragraphs(2),
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

  if (curationCategory) {
    data.curationCategory = { connect: { id: curationCategory.id } };
  }

  if (IABParentCategory) {
    data.IABParentCategory = { connect: { id: IABParentCategory.id } };

    // only set a sub category if the parent was also set
    if (IABChildCategory) {
      data.IABChildCategory = { connect: { id: IABChildCategory.id } };
    }
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

export async function createIABCategoryHelper(
  prisma: PrismaClient,
  name: string,
  parent?: IABCategory
): Promise<IABCategory> {
  const slug = slugify(name, slugifyConfig);

  const data: Prisma.IABCategoryCreateInput = { name, slug };

  if (parent) {
    data.parent = { connect: { id: parent.id } };
  }

  return await prisma.iABCategory.create({ data });
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
    'IABCategory',
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
