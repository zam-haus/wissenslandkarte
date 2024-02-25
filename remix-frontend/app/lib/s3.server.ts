import type { UploadHandler } from "@remix-run/node";
import { writeAsyncIterableToWritable } from "@remix-run/node";
import AWS from "aws-sdk";
import { randomUUID } from "crypto";
import { PassThrough } from "stream";

import { getFromEnv, getFromEnvOrThrow } from "./environment";

const bucket = getFromEnvOrThrow("S3_STORAGE_BUCKET");
export const MAX_UPLOAD_SIZE_IN_BYTE = 10 * 1024 * 1024;

const s3 = new AWS.S3({
  credentials: {
    accessKeyId: getFromEnvOrThrow("S3_STORAGE_ACCESS_KEY"),
    secretAccessKey: getFromEnvOrThrow("S3_STORAGE_SECRET_KEY"),
  },
  region: getFromEnvOrThrow("S3_STORAGE_REGION"),

  ...(getFromEnv("S3_STORAGE_IS_MINIO", Boolean)
    ? {
        endpoint: getFromEnvOrThrow("S3_STORAGE_ENDPOINT"),
        s3ForcePathStyle: true,
        sslEnabled: false,
      }
    : {}),
});

export function createS3UploadHandler(formFieldsToUpload: string[]): UploadHandler {
  return async ({ name, data, contentType, filename }) => {
    if (!formFieldsToUpload.includes(name)) {
      return undefined;
    }
    if (!contentType.startsWith("image/")) {
      //TODO: check if file is really an image
      return undefined;
    }

    const newFilename = createValidFilename(filename);
    try {
      const uploadedFileLocation = await uploadStreamToS3(data, newFilename, contentType);
      if (uploadedFileLocation.success) {
        return uploadedFileLocation.data?.Location;
      } else {
        console.error("Uploading of a file to S3 failed!");
        return "";
      }
    } catch (e) {
      console.error("Uploading of a file to S3 failed!");
      return "";
    }
  };
}

async function uploadStreamToS3(data: any, filename: string, contentType: string) {
  let uploadedFileSize = 0;
  const passThroughWithSizeLimit = new PassThrough({
    transform(chunk, encoding, callback) {
      uploadedFileSize += chunk.length;
      if (uploadedFileSize > MAX_UPLOAD_SIZE_IN_BYTE) {
        this.emit("error", "Size limit exceeded");
        return;
      }
      callback(null, chunk);
    },
  });

  type DataOrError<T> = { success: boolean; data?: T; error?: any };
  const uploadDone = new Promise<DataOrError<AWS.S3.ManagedUpload.SendData>>((resolve) => {
    s3.upload(
      {
        Bucket: bucket,
        Key: filename,
        Body: passThroughWithSizeLimit,
        ContentType: contentType,
      },
      {},
      (error, data) => {
        if (error)
          resolve({
            success: false,
            error,
          });
        // if we reject here, things break in weird ways, even if we catch the exception
        else resolve({ success: true, data });
      }
    );
  });

  await writeAsyncIterableToWritable(data, passThroughWithSizeLimit);
  return uploadDone;
}

function createValidFilename(filename: string | undefined) {
  const uuid = randomUUID();
  if (filename === undefined) {
    return uuid;
  }

  const elements = filename.toLowerCase().split(".");
  const [suffix, ..._] = elements.reverse();
  const allowedSuffixes = [
    "apng",
    "avif",
    "gif",
    "jpg",
    "jpeg",
    "jfif",
    "pjpeg",
    "pjp",
    "png",
    "svg",
    "webp",
  ];
  if (!allowedSuffixes.includes(suffix)) {
    return uuid;
  }
  return `${uuid}.${suffix}`;
}
