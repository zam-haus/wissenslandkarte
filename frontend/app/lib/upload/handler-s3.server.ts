import { randomUUID } from "crypto";
import { PassThrough } from "stream";
import { ReadableStream } from "stream/web";

import type { UploadHandler } from "@remix-run/node";
import { writeReadableStreamToWritable } from "@remix-run/node";
import AWS from "aws-sdk";
import { fileTypeFromStream } from "file-type";

import { environment } from "../environment.server";

import { MAX_UPLOAD_SIZE_IN_BYTE } from "./constants";

const bucket = environment.s3.BUCKET;
const s3 = new AWS.S3({
  credentials: {
    accessKeyId: environment.s3.ACCESS_KEY,
    secretAccessKey: environment.s3.SECRET_KEY,
  },
  region: environment.s3.REGION,

  ...(environment.s3.IS_MINIO
    ? {
        endpoint: environment.s3.ENDPOINT,
        s3ForcePathStyle: true,
        sslEnabled: false,
      }
    : {}),
});

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

export function createS3UploadHandler(formFieldsToUpload: string[]): UploadHandler {
  return async ({ name, data, contentType, filename }) => {
    console.log("checking ", name);
    if (!formFieldsToUpload.includes(name)) {
      console.log("doesn't match name", formFieldsToUpload, name);
      return undefined;
    }
    if (!allowedSuffixes.some((suffix) => filename?.toLowerCase().endsWith(suffix))) {
      console.log("doesn't match suffix");
      return undefined;
    }
    if (!contentType.startsWith("image/") && !contentType.startsWith("application/octet-stream")) {
      console.log("doesn't match type", contentType, "image/");
      return undefined;
    }

    const stream = ReadableStream.from(data);
    const [streamForDetection, streamForUpload] = stream.tee();
    console.log("got two streams");
    const { ext: detectedSuffix, mime: detectedMime } =
      (await fileTypeFromStream(streamForDetection)) ?? {};
    console.log("got ", detectedMime, detectedSuffix);

    if (!detectedMime || !detectedMime.startsWith("image/")) {
      console.log("detected mime doesn't match type", detectedMime, "image/");
      return undefined;
    }

    if (!detectedSuffix || !allowedSuffixes.includes(detectedSuffix)) {
      console.log("doesn't match detected suffix", detectedSuffix);
      return undefined;
    }

    const newFilename = createValidFilename(filename);
    console.log("uploading to", newFilename);
    try {
      const uploadedFileLocation = await uploadStreamToS3(
        streamForUpload,
        newFilename,
        contentType,
      );
      if (!uploadedFileLocation.success || uploadedFileLocation.data === undefined) {
        console.error("Uploading of a file to S3 failed!");
        return undefined;
      }

      const uploadedFileUrl = new URL(uploadedFileLocation.data.Location);

      if (environment.s3.OVERRIDE_HOST !== undefined) {
        uploadedFileUrl.host = environment.s3.OVERRIDE_HOST;
      }

      return uploadedFileUrl.toString().replace(/https?:/, "");
    } catch (e) {
      console.error("Uploading of a file to S3 failed!", e);
      return undefined;
    }
  };
}

async function uploadStreamToS3(
  data: ReadableStream<Uint8Array>,
  filename: string,
  contentType: string,
) {
  let uploadedFileSize = 0;
  const passThroughWithSizeLimit = new PassThrough({
    transform: function (this: PassThrough, chunk, encoding, callback) {
      if (chunk instanceof Uint8Array) {
        uploadedFileSize += chunk.length;
        if (uploadedFileSize > MAX_UPLOAD_SIZE_IN_BYTE) {
          this.emit("error", "Size limit exceeded");
          return;
        }
      }
      callback(null, chunk);
    },
  });

  type DataOrError<T> = { success: boolean; data?: T; error?: unknown };
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
        // types seem incorrect?!
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (error)
          resolve({
            success: false,
            error,
          });
        // if we reject here, things break in weird ways, even if we catch the exception
        else resolve({ success: true, data });
      },
    );
  });

  await writeReadableStreamToWritable(data as globalThis.ReadableStream, passThroughWithSizeLimit);
  return uploadDone;
}

function createValidFilename(filename: string | undefined) {
  const uuid = randomUUID();
  if (filename === undefined) {
    return uuid;
  }

  const elements = filename.toLowerCase().split(".");
  const [suffix, ...__] = elements.reverse();
  if (!allowedSuffixes.includes(suffix)) {
    return uuid;
  }
  return `${uuid}.${suffix}`;
}
