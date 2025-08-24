import { Logger } from "winston";

import { Attachment, Project } from "prisma/generated";
import { storePurpose } from "~/lib/storage/s3Management.server";

export function storeAttachmentsS3ObjectPurposes(
  s3Urls: string[],
  attachments: Pick<Attachment, "id" | "url">[],
  logger: Logger,
) {
  for (const s3Url of s3Urls) {
    const id = attachments.find((it) => it.url === s3Url)?.id;
    if (id === undefined) {
      logger.error("Could not store s3 object purpose: no attachment id for %s", s3Url);
      continue;
    }
    storePurpose(s3Url, {
      attachmentTo: { id },
    }).catch((error: unknown) => {
      logger.error("Error storing s3 object purpose", { error });
    });
  }
}

export function storeProjectMainImageS3ObjectPurposes(
  s3Url: string,
  project: Pick<Project, "id">,
  logger: Logger,
) {
  storePurpose(s3Url, {
    projectMainImage: project,
  }).catch((error: unknown) => {
    logger.error("Error storing s3 object purpose", { error });
  });
}
