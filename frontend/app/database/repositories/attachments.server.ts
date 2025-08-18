import { prisma } from "~/database/db.server";

export async function markAttachmentsAsStale(attachmentIds: string[]) {
  if (attachmentIds.length === 0) {
    return;
  }

  return await prisma.attachment.updateMany({
    where: {
      id: {
        in: attachmentIds,
      },
    },
    data: {
      isStale: true,
      projectId: null,
      projectStepId: null,
    },
  });
}
