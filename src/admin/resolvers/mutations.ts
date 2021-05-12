import {
  Collection,
  CollectionAuthor,
  CollectionStory,
  Image,
  ImageEntityType,
  PrismaClient,
} from '@prisma/client';
import * as Sentry from '@sentry/node';
import {
  CreateCollectionAuthorInput,
  CreateCollectionInput,
  CreateCollectionStoryInput,
  CreateImageInput,
  UpdateCollectionAuthorInput,
  UpdateCollectionInput,
  UpdateCollectionStoryInput,
} from '../../database/types';
import {
  associateImageWithEntity,
  createAuthor,
  createCollection as dbCreateCollection,
  createCollectionStory as dbCreateCollectionStory,
  createImage,
  deleteCollectionStory as dbDeleteCollectionStory,
  updateAuthor,
  updateCollection as dbUpdateCollection,
  updateCollectionStory as dbUpdateCollectionStory,
} from '../../database/mutations';
import { S3 } from 'aws-sdk';
import { uploadImage } from '../../aws/upload';
import { FileUpload } from 'graphql-upload';
import { createReadStream, ReadStream } from 'fs';

/**
 * Executes a mutation, catches exceptions and records to sentry and console
 * @param db
 * @param data
 * @param callback
 * @param imageEntityType
 */
export async function executeMutation<T, U>(
  db: PrismaClient,
  data: T,
  callback: (db: PrismaClient, data: T) => Promise<U>,
  imageEntityType: ImageEntityType = undefined
): Promise<U> {
  try {
    const entity = await callback(db, data);

    // Associate the image with the entity if the image entity type is provided
    // and a record for the image exists
    if (imageEntityType) {
      await associateImageWithEntity(
        db,
        entity as U & { id: number; imageUrl: string },
        imageEntityType
      );
    }

    return entity;
  } catch (ex) {
    console.log(ex);
    Sentry.captureException(ex);
    throw new Error(ex);
  }
}

/**
 * @param parent
 * @param data
 * @param db
 */
export async function createCollectionAuthor(
  parent,
  { data },
  { db }
): Promise<CollectionAuthor> {
  return executeMutation<CreateCollectionAuthorInput, CollectionAuthor>(
    db,
    data,
    createAuthor,
    ImageEntityType.COLLECTION_AUTHOR
  );
}

/**
 * @param parent
 * @param data
 * @param db
 */
export async function updateCollectionAuthor(
  parent,
  { data },
  { db }
): Promise<CollectionAuthor> {
  return executeMutation<UpdateCollectionAuthorInput, CollectionAuthor>(
    db,
    data,
    updateAuthor,
    ImageEntityType.COLLECTION_AUTHOR
  );
}

/**
 * @param parent
 * @param data
 * @param db
 */
export async function createCollection(
  parent,
  { data },
  { db }
): Promise<Collection> {
  return executeMutation<CreateCollectionInput, Collection>(
    db,
    data,
    dbCreateCollection,
    ImageEntityType.COLLECTION
  );
}

/**
 * @param parent
 * @param data
 * @param db
 */
export async function updateCollection(
  parent,
  { data },
  { db }
): Promise<Collection> {
  return await executeMutation<UpdateCollectionInput, Collection>(
    db,
    data,
    dbUpdateCollection,
    ImageEntityType.COLLECTION
  );
}

/**
 * @param parent
 * @param data
 * @param db
 */
export async function createCollectionStory(
  parent,
  { data },
  { db }
): Promise<CollectionStory> {
  return await executeMutation<CreateCollectionStoryInput, CollectionStory>(
    db,
    data,
    dbCreateCollectionStory,
    ImageEntityType.COLLECTION_STORY
  );
}

/**
 * @param parent
 * @param data
 * @param db
 */
export async function updateCollectionStory(
  parent,
  { data },
  { db }
): Promise<CollectionStory> {
  return await executeMutation<UpdateCollectionStoryInput, CollectionStory>(
    db,
    data,
    dbUpdateCollectionStory,
    ImageEntityType.COLLECTION_STORY
  );
}

/**
 * @param parent
 * @param externalId
 * @param db
 */
export async function deleteCollectionStory(
  parent,
  { externalId },
  { db }
): Promise<CollectionStory> {
  return await executeMutation<string, CollectionStory>(
    db,
    externalId,
    dbDeleteCollectionStory
  );
}

/**
 * @param parent
 * @param data
 * @param s3
 * @param db
 */
export async function collectionImageUpload(
  parent,
  { data },
  { s3, db }: { s3: S3; db: PrismaClient }
) {
  const { image, ...imageData } = data;
  console.log(imageData);

  const fileUpload: FileUpload = {
    filename: imageData.name,
    mimetype: imageData.mimeType,
    encoding: '',
    createReadStream: (): ReadStream => {
      return image;
    },
  };

  const upload = await uploadImage(s3, fileUpload);

  await executeMutation<CreateImageInput, Image>(
    db,
    { ...imageData, ...upload },
    createImage
  );

  return { url: upload.path };
}
