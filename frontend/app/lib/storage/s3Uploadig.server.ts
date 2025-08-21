import { ReadableStream, TransformStream } from "stream/web";

import { Upload } from "@aws-sdk/lib-storage";
import { StreamingBlobPayloadInputTypes } from "@smithy/types";

import { S3Object } from "prisma/generated";
import {
  createS3Object,
  updateS3Object,
  updateS3ObjectStatus,
} from "~/database/repositories/s3Objects.server";

import { baseLogger } from "../logging.server";
import { s3Client, s3Bucket } from "../storage/s3-client.server";

import { MAX_UPLOAD_SIZE_IN_BYTE } from "./constants";
import { getPublicUrl } from "./s3Management.server";

const logger = baseLogger.withTag("s3-uploading");

type NonnullableKeys<T, K extends keyof T> = {
  [P in K]: NonNullable<T[P]>;
};
type S3ObjectUploaded = NonnullableKeys<S3Object, "url" | "publicUrl">;
export async function uploadStreamToS3(
  inputData: ReadableStream<Uint8Array>,
  filename: string,
  contentType: string,
) {
  let uploadedFileSize = 0;
  const passThroughWithSizeLimit = new TransformStream<Uint8Array, Uint8Array>({
    transform: function (chunk, controller) {
      uploadedFileSize += chunk.length;

      if (uploadedFileSize > MAX_UPLOAD_SIZE_IN_BYTE) {
        logger.warn("Size limit exceeded for upload %s", filename);
        controller.error("Size limit exceeded");
        return;
      }

      controller.enqueue(chunk);
    },
  });

  const s3ObjectUploading = await createS3Object({
    key: filename,
    bucket: s3Bucket,
    status: "uploading",
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

  try {
    const uploadResult = await upload.done();
    if (uploadResult.Location === undefined) {
      logger.error(
        "No Location returned by s3 lib. File %s may still have been uploaded.",
        filename,
      );
      throw Error("No Location returned by s3 lib. File may still have been uploaded.");
    }

    const s3ObjectUploaded = await updateS3Object(s3ObjectUploading.id, {
      status: "uploaded",
      url: uploadResult.Location,
      publicUrl: getPublicUrl(uploadResult.Location),
    });

    return s3ObjectUploaded as S3ObjectUploaded;
  } catch (error) {
    logger.error("Error uploading file %s", filename, { error });
    await updateS3ObjectStatus(s3ObjectUploading.id, "failed");
    throw error;
  }
}
