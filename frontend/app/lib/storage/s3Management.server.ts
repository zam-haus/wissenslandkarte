import { Attachment, Project, User } from "prisma/generated";
import { updateS3ObjectByPublicUrl } from "~/database/repositories/s3Objects.server";

import { environment } from "../environment.server";

export function getPublicUrl(s3Url: string) {
  const uploadedFileUrl = new URL(s3Url);

  if (environment.s3.OVERRIDE_HOST !== undefined) {
    uploadedFileUrl.host = environment.s3.OVERRIDE_HOST;
    uploadedFileUrl.port = "";
  }

  return uploadedFileUrl.toString().replace(/https?:/, "");
}

export async function storePurpose(
  publicS3Url: string,
  purpose: {
    attachmentTo?: Pick<Attachment, "id">;
    projectMainImage?: Pick<Project, "id">;
    userProfileImage?: Pick<User, "id">;
  },
) {
  return updateS3ObjectByPublicUrl(publicS3Url, {
    attachmentId: purpose.attachmentTo?.id,
    mainImageInProjectId: purpose.projectMainImage?.id,
    imageOfUserId: purpose.userProfileImage?.id,
  });
}
