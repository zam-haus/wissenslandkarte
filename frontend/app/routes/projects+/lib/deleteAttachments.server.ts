import { Attachment } from "prisma/generated";
import { prisma } from "~/database/db.server";
import { markAttachmentsAsStale } from "~/database/repositories/attachments.server";
import { logger } from "~/lib/logging.server";
import { deleteS3Files } from "~/lib/storage/s3Deletion.server";

export async function deleteAttachmentFilesByIds(ids: string[]) {
  const attachments = await prisma.attachment.findMany({
    where: {
      id: { in: ids },
    },
  });
  await deleteAttachmentFiles(attachments);
}

export async function deleteAttachmentFiles(
  attachments: Pick<Attachment, "id" | "url" | "type">[],
) {
  const imageAndFileAttachments = attachments.filter((attachment) =>
    ["image", "file"].includes(attachment.type as "image" | "file"),
  );

  const s3Result = await deleteS3Files(imageAndFileAttachments.map((attachment) => attachment.url));

  if (!s3Result.success) {
    logger("delete-attachments").warn(
      `Failed to delete S3 files attachments: ${s3Result.failedUrls.length} failed deletions`,
    );

    const failedAttachmentIds = attachments
      .filter((attachment) => s3Result.failedUrls.includes(attachment.url))
      .map((attachment) => attachment.id);

    if (failedAttachmentIds.length > 0) {
      await markAttachmentsAsStale(failedAttachmentIds);
      logger("delete-attachments").info(
        `Marked ${failedAttachmentIds.length} attachments as stale`,
      );
    }
  }
}
