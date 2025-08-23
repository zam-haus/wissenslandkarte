import { ReadableStream } from "stream/web";

import type { UploadHandler } from "@remix-run/node";
import { fileTypeFromStream } from "file-type";

import { User } from "prisma/generated";

import { baseLogger } from "../logging.server";
import { uploadStreamToS3 } from "../storage/s3Uploadig.server";

import {
  createValidFilename,
  validateContentType,
  validateFilename,
  validateSuffix,
  ValidationResult,
} from "./validation.server";

const logger = baseLogger.withTag("upload-s3");

export function createS3UploadHandler(
  formFieldsToUpload: string[],
  uploader: Pick<User, "id">,
): UploadHandler {
  return async ({ name, data, contentType, filename }) => {
    logger.debug("checking name %s", name);
    if (!formFieldsToUpload.includes(name)) {
      logger.debug("name %s doesn't match name %s", formFieldsToUpload, name);
      return undefined;
    }

    logger.debug("validating user-provided data");
    if (
      validateFilename(filename) === ValidationResult.Invalid ||
      validateContentType(contentType) === ValidationResult.Invalid
    ) {
      return undefined;
    }

    const stream = ReadableStream.from(data);
    const [streamForDetection, streamForUpload] = stream.tee();
    const { ext: detectedSuffix, mime: detectedMime } =
      (await fileTypeFromStream(streamForDetection)) ?? {};
    logger.debug("detected mime is: %s %s", detectedMime, detectedSuffix);

    logger.debug("validating detected data");
    if (
      validateSuffix(detectedSuffix) === ValidationResult.Invalid ||
      validateContentType(detectedMime) === ValidationResult.Invalid
    ) {
      return undefined;
    }

    const newFilename = createValidFilename(filename);
    logger.debug("uploading to %s", newFilename);
    try {
      const uploadResult = await uploadStreamToS3(
        streamForUpload,
        newFilename,
        contentType,
        uploader,
      );

      return uploadResult.publicUrl;
    } catch (error) {
      logger.error("Uploading of a file to S3 as %s has failed!", newFilename, { error });
      return undefined;
    }
  };
}
