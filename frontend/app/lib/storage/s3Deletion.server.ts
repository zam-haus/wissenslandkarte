import { DeleteObjectsCommand } from "@aws-sdk/client-s3";

import { getS3ObjectsByPublicUrls } from "~/database/repositories/s3Objects.server";

import { baseLogger } from "../logging.server";
import { s3Bucket, s3Client } from "../storage/s3-client.server";

const logger = baseLogger.withTag("s3-management");

export async function deleteS3Files(urlsToDelete: string[]): Promise<{
  success: boolean;
  successfulDeletions: number;
  failedUrls: string[];
}> {
  if (urlsToDelete.length === 0) {
    return {
      success: true,
      successfulDeletions: 0,
      failedUrls: [],
    };
  }

  logger.debug("Attempting to delete %d S3 files", urlsToDelete.length);
  logger.debug("URLs to delete: %o", urlsToDelete);

  const s3Objects = await getS3ObjectsByPublicUrls(urlsToDelete);
  const failedUrls: string[] = [];

  if (s3Objects.length !== urlsToDelete.length) {
    const missingKeys = urlsToDelete.filter(
      (it) => !s3Objects.some((s3Object) => s3Object.key === it),
    );
    logger.error("Could not find all S3 objects for the given URLs: %o", missingKeys);
  }

  try {
    const deleteObjects = s3Objects.map((it) => {
      if (it.bucket !== s3Bucket) {
        if (it.url !== null) {
          failedUrls.push(it.url);
        }
        logger.error("S3 object is not in the correct bucket: %s", it.bucket);
      }
      return { Key: it.key };
    });
    logger.debug("Delete objects request: %o", deleteObjects);
    logger.debug("Using bucket: %s", s3Bucket);

    const command = new DeleteObjectsCommand({
      Bucket: s3Bucket,
      Delete: {
        Objects: deleteObjects,
        Quiet: false,
      },
    });

    const result = await s3Client.send(command);

    logger.debug("Delete result: %o", {
      deleted: result.Deleted?.map((d) => ({ key: d.Key, versionId: d.VersionId })),
      errors: result.Errors?.map((e) => ({ key: e.Key, code: e.Code, message: e.Message })),
    });

    const successfulDeletions = result.Deleted?.length ?? 0;
    const s3Errors = result.Errors ?? [];

    if (s3Errors.length > 0) {
      for (const error of s3Errors) {
        const failedS3Object = s3Objects.find((it) => it.key === error.Key);
        if (failedS3Object && failedS3Object.url !== null) {
          failedUrls.push(failedS3Object.url);
        }
      }

      logger.warn("Some S3 files failed to delete: %d errors", s3Errors.length);
      for (const error of s3Errors) {
        logger.warn("Failed to delete key %s: %s (%s)", error.Key, error.Message, error.Code, {
          error,
        });
      }
    }

    logger.debug(
      "Successfully deleted %d out of %d S3 files",
      successfulDeletions,
      urlsToDelete.length,
    );

    return { success: failedUrls.length === 0, successfulDeletions, failedUrls };
  } catch (error) {
    logger.error("Failed to execute batch S3 deletion", error);
    return {
      success: false,
      successfulDeletions: 0,
      failedUrls: urlsToDelete,
    };
  }
}
