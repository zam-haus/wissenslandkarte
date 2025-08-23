import { S3Object } from "prisma/generated";
import { prisma } from "~/database/db.server";

export const s3ObjectStatus = ["pending", "uploading", "uploaded", "orphaned", "failed"] as const;
export type S3ObjectStatus = (typeof s3ObjectStatus)[number];

export async function createS3Object(data: {
  key: string;
  bucket: string;
  status?: S3ObjectStatus;
  uploadedById?: string;
}) {
  return await prisma.s3Object.create({
    data: {
      key: data.key,
      bucket: data.bucket,
      status: data.status || "pending",
      uploadedById: data.uploadedById,
    },
  });
}

export async function updateS3Object(s3ObjectId: string, data: Partial<Omit<S3Object, "id">>) {
  return prisma.s3Object.update({
    where: { id: s3ObjectId },
    data,
  });
}

export async function updateS3ObjectByPublicUrl(
  publicUrl: string,
  data: Partial<Omit<S3Object, "id">>,
) {
  return prisma.s3Object.update({
    where: { publicUrl },
    data,
  });
}

export async function updateS3ObjectStatus(s3ObjectId: string, status: S3ObjectStatus) {
  return prisma.s3Object.update({
    where: { id: s3ObjectId },
    data: { status },
  });
}

export async function markS3ObjectsAsOrphanedAndUnlink(s3ObjectIds: string[]) {
  return prisma.s3Object.updateMany({
    where: { id: { in: s3ObjectIds } },
    data: {
      status: "orphaned",
      attachmentId: null,
      mainImageInProjectId: null,
      imageOfUserId: null,
    },
  });
}

export async function getS3ObjectsByPublicUrls(publicUrls: string[]) {
  return prisma.s3Object.findMany({
    where: { publicUrl: { in: publicUrls } },
  });
}

export async function deleteS3Objects(s3ObjectIds: string[]) {
  return prisma.s3Object.deleteMany({
    where: { id: { in: s3ObjectIds } },
  });
}

export async function getProblematicS3Objects() {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  return await prisma.s3Object.findMany({
    where: {
      OR: [
        { status: "failed" },
        { status: "orphaned" },
        {
          AND: [{ status: "pending" }, { uploadedAt: { lt: tenMinutesAgo } }],
        },
        { uploadedById: null },
        {
          AND: [{ attachmentId: null }, { mainImageInProjectId: null }, { imageOfUserId: null }],
        },
      ],
    },
    include: {
      uploadedBy: {
        select: {
          id: true,
          username: true,
        },
      },
      attachment: {
        select: {
          id: true,
        },
      },
      mainImageIn: {
        select: {
          id: true,
          title: true,
        },
      },
      imageOfUser: {
        select: {
          id: true,
          username: true,
        },
      },
    },
    orderBy: {
      uploadedAt: "desc",
    },
  });
}
