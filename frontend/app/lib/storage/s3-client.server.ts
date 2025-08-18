import { S3Client } from "@aws-sdk/client-s3";

import { environment } from "../environment.server";

export const s3Client = new S3Client({
  credentials: {
    accessKeyId: environment.s3.ACCESS_KEY,
    secretAccessKey: environment.s3.SECRET_KEY,
  },
  region: environment.s3.REGION,

  ...(environment.s3.IS_MINIO
    ? ({
        endpoint: environment.s3.ENDPOINT,
        forcePathStyle: true,
        tls: false,
      } satisfies ConstructorParameters<typeof S3Client>[0])
    : {}),
});

export const s3Bucket = environment.s3.BUCKET;
