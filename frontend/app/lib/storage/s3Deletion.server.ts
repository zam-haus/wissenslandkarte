import { _Error, DeletedObject, DeleteObjectsCommand } from "@aws-sdk/client-s3";

import { S3Object } from "prisma/generated";
import {
  deleteS3Objects,
  getS3ObjectsByPublicUrls,
  markS3ObjectsAsOrphanedAndUnlink,
  updateS3ObjectStatus,
} from "~/database/repositories/s3Objects.server";

import { baseLogger } from "../logging.server";
import { s3Bucket, s3Client } from "../storage/s3-client.server";

const logger = baseLogger.withTag("s3-management");

export async function deleteS3FilesByPublicUrl(urlsToDelete: string[]): Promise<undefined> {
  if (urlsToDelete.length === 0) {
    return;
  }

  logger.debug("Attempting to delete %d S3 files", urlsToDelete.length);
  logger.debug("URLs to delete: %o", urlsToDelete);

  const s3Objects = await loadS3Objects(urlsToDelete);

  try {
    const command = makeDeleteObjectsCommand(s3Objects);

    const result = await s3Client.send(command);

    logger.debug("Delete result: %o", {
      deleted: result.Deleted?.map((d) => ({ key: d.Key, versionId: d.VersionId })),
      errors: result.Errors?.map((e) => ({ key: e.Key, code: e.Code, message: e.Message })),
    });

    if (result.Deleted !== undefined) {
      await handleSuccessfulDeletions(result.Deleted, s3Objects);
    }

    if (result.Errors !== undefined) {
      await handleFailedDeletions(result.Errors, s3Objects);
    }
  } catch (error) {
    logger.error("Failed to execute batch S3 deletion", error);
    await markS3ObjectsAsOrphanedAndUnlink(s3Objects.map((it) => it.id));
  }
}

async function loadS3Objects(urlsToDelete: string[]) {
  const s3Objects = await getS3ObjectsByPublicUrls(urlsToDelete);

  if (s3Objects.length !== urlsToDelete.length) {
    const missingKeys = urlsToDelete.filter(
      (it) => !s3Objects.some((s3Object) => s3Object.key === it),
    );
    logger.error("Could not find all S3 objects for the given URLs: %o", missingKeys);
  }

  return s3Objects;
}

function makeDeleteObjectsCommand(s3Objects: S3Object[]) {
  const deleteObjects = s3Objects.flatMap((it) => {
    if (it.bucket !== s3Bucket) {
      logger.error("S3 object is not in the correct bucket: %s", it.bucket);
      updateS3ObjectStatus(it.id, "orphaned").catch((error: unknown) => {
        logger.error("Failed to update S3 object status: %s", { error });
      });
      return [];
    }
    return { Key: it.key };
  });
  logger.debug("Delete objects request: %o", deleteObjects);
  logger.debug("Using bucket: %s", s3Bucket);

  return new DeleteObjectsCommand({
    Bucket: s3Bucket,
    Delete: {
      Objects: deleteObjects,
      Quiet: false,
    },
  });
}

async function handleSuccessfulDeletions(deletedObjects: DeletedObject[], s3Objects: S3Object[]) {
  const successfulS3ObjectIds = deletedObjects.flatMap((deletedObject) => {
    return s3Objects.find((it) => it.key === deletedObject.Key)?.id ?? [];
  });
  await deleteS3Objects(successfulS3ObjectIds);
}

async function handleFailedDeletions(s3Errors: _Error[], s3Objects: S3Object[]) {
  logger.error("Some S3 files failed to delete: %d errors", s3Errors.length);
  const failedS3ObjectIds = s3Errors.flatMap((error) => {
    logger.warn("Failed to delete key %s: %s (%s)", error.Key, error.Message, error.Code, {
      error: error,
    });
    return s3Objects.find((it) => it.key === error.Key)?.id ?? [];
  });

  await markS3ObjectsAsOrphanedAndUnlink(failedS3ObjectIds);
}
