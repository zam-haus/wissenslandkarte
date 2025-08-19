import { S3Object } from "prisma/generated";
import { prisma } from "~/database/db.server";

export const s3ObjectStatus = ["pending", "uploading", "uploaded", "orphaned", "failed"] as const;
export type S3ObjectStatus = (typeof s3ObjectStatus)[number];

export async function createS3Object(data: {
  key: string;
  bucket: string;
  status?: S3ObjectStatus;
}) {
  return await prisma.s3Object.create({
    data: {
      key: data.key,
      bucket: data.bucket,
      status: data.status || "pending",
    },
  });
}

export async function updateS3Object(s3ObjectId: string, data: Partial<Omit<S3Object, "id">>) {
  return prisma.s3Object.update({
    where: { id: s3ObjectId },
    data,
  });
}

export async function updateS3ObjectStatus(s3ObjectId: string, status: S3ObjectStatus) {
  return prisma.s3Object.update({
    where: { id: s3ObjectId },
    data: { status },
  });
}
