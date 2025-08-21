import { DeleteObjectsCommand } from "@aws-sdk/client-s3";

import { environment } from "../environment.server";
import { baseLogger } from "../logging.server";
import { s3Client, s3Bucket } from "../storage/s3-client.server";

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

  const { validEntries: s3Keys, invalidUrls } = extractS3KeysFromUrls(urlsToDelete);

  logger.debug(
    "Extracted S3 keys: %o",
    s3Keys.map((entry) => ({ url: entry.url, key: entry.key })),
  );
  logger.debug("Invalid URLs: %o", invalidUrls);

  if (s3Keys.length === 0) {
    logger.warn("No valid S3 keys found in URLs");
    return {
      success: false,
      successfulDeletions: 0,
      failedUrls: urlsToDelete,
    };
  }

  try {
    const deleteObjects = s3Keys.map((entry) => ({ Key: entry.key }));
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

    const failedUrls: string[] = [...invalidUrls];

    for (const error of s3Errors) {
      const failedEntry = s3Keys.find((entry) => entry.key === error.Key);
      if (failedEntry) {
        failedUrls.push(failedEntry.url);
      }
    }

    if (s3Errors.length > 0) {
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

function extractS3KeysFromUrls(urls: string[]): {
  validEntries: { url: string; key: string }[];
  invalidUrls: string[];
} {
  const validEntries: { url: string; key: string }[] = [];
  const invalidUrls: string[] = [];

  for (const url of urls) {
    const key = extractS3KeyFromUrl(url);
    if (key === null) {
      invalidUrls.push(url);
    } else {
      validEntries.push({ url, key });
    }
  }
  return { validEntries, invalidUrls };
}

function extractS3KeyFromUrl(url: string): string | null {
  try {
    const cleanUrl = url.replace(/^https?:/, "");
    const { pathname } = new URL(`https:${cleanUrl}`);

    const path = pathname.substring(1);

    if (path.length === 0) {
      logger.warn("Could not extract S3 key from URL: %s", url);
      return null;
    }

    if (path.startsWith(`${s3Bucket}/`)) {
      return path.substring(s3Bucket.length + 1);
    }

    return path;
  } catch (error) {
    logger.warn("Failed to parse URL for S3 key extraction: %s", url, error);
    return null;
  }
}

export function getPublicUrl(s3Url: string) {
  const uploadedFileUrl = new URL(s3Url);

  if (environment.s3.OVERRIDE_HOST !== undefined) {
    uploadedFileUrl.host = environment.s3.OVERRIDE_HOST;
  }

  return uploadedFileUrl.toString().replace(/https?:/, "");
}
