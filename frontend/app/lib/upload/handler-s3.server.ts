import { ReadableStream, TransformStream } from "stream/web";

import { CompleteMultipartUploadCommandOutput } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import type { UploadHandler } from "@remix-run/node";
import { StreamingBlobPayloadInputTypes } from "@smithy/types";
import { fileTypeFromStream } from "file-type";

import { environment } from "../environment.server";
import { baseLogger } from "../logging.server";
import { s3Client, s3Bucket } from "../storage/s3-client.server";

import { MAX_UPLOAD_SIZE_IN_BYTE } from "./constants";
import {
  createValidFilename,
  validateContentType,
  validateFilename,
  validateSuffix,
  ValidationResult,
} from "./validation.server";

const logger = baseLogger.withTag("upload-s3");

export function createS3UploadHandler(formFieldsToUpload: string[]): UploadHandler {
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
      const uploadResult = await uploadStreamToS3(streamForUpload, newFilename, contentType);

      const uploadedFileUrl = new URL(uploadResult.Location);

      if (environment.s3.OVERRIDE_HOST !== undefined) {
        uploadedFileUrl.host = environment.s3.OVERRIDE_HOST;
      }

      return uploadedFileUrl.toString().replace(/https?:/, "");
    } catch (error) {
      logger.error("Uploading of a file to S3 as %s has failed!", newFilename, { error });
      return undefined;
    }
  };
}

async function uploadStreamToS3(
  inputData: ReadableStream<Uint8Array>,
  filename: string,
  contentType: string,
) {
  let uploadedFileSize = 0;
  const passThroughWithSizeLimit = new TransformStream<Uint8Array, Uint8Array>({
    transform: function (chunk, controller) {
      uploadedFileSize += chunk.length;

      if (uploadedFileSize > MAX_UPLOAD_SIZE_IN_BYTE) {
        controller.error("Size limit exceeded");
        return;
      }

      controller.enqueue(chunk);
    },
  });

  const pipedStream = inputData.pipeThrough(passThroughWithSizeLimit);

  const minSupportedPartSize = 1024 * 1024 * 5;
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: s3Bucket,
      Key: filename,
      ContentType: contentType,
      // Somehow the transform types don't fully match
      Body: pipedStream as StreamingBlobPayloadInputTypes,
    },
    queueSize: 4,
    partSize: minSupportedPartSize,
    leavePartsOnError: false,
  });

  const uploadResult = await upload.done();
  if (uploadResult.Location === undefined) {
    throw Error("No Location returned by s3 lib. File may still have been uploaded.");
  }
  return uploadResult as CompleteMultipartUploadCommandOutput &
    Required<Pick<CompleteMultipartUploadCommandOutput, "Location">>;
}
