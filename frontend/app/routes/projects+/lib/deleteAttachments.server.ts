import { Attachment } from "prisma/generated";
import { prisma } from "~/database/db.server";
import { deleteS3FilesByPublicUrl } from "~/lib/storage/s3Deletion.server";

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

  await deleteS3FilesByPublicUrl(imageAndFileAttachments.map((attachment) => attachment.url));
}
