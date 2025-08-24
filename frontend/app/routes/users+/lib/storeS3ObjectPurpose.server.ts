import { Logger } from "winston";

import { User } from "prisma/generated";
import { storePurpose } from "~/lib/storage/s3Management.server";

export function storeProfileImageS3ObjectPurposes(
  s3Url: string,
  user: Pick<User, "id">,
  logger: Logger,
) {
  storePurpose(s3Url, {
    userProfileImage: { id: user.id },
  }).catch((error: unknown) => {
    logger.error("Error storing s3 object purpose", { error });
  });
}
