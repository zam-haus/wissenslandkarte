import type { ProjectUpdate } from "@prisma/client";
import type { AttachmentType } from "prisma/fake-data-generators";

import { prisma } from "~/db.server";

type ProjectUpdateCreateRequest = {
  projectId: string;
  description: string;
  photoAttachmentUrls: string[];
};
export async function createProjectUpdate(request: ProjectUpdateCreateRequest) {
  return prisma.project.update({
    where: { id: request.projectId },
    data: {
      updates: {
        create: {
          creationDate: new Date(),
          latestModificationDate: new Date(),
          description: request.description,
          attachments: {
            create: request.photoAttachmentUrls.map((url) => ({
              type: "image" as AttachmentType,
              url,
              text: "",
              creationDate: new Date(),
            })),
          },
        },
      },
    },
  });
}

export async function getProjectUpdateWithProjectOwnersAndMembers(
  projectUpdateId: ProjectUpdate["id"]
) {
  return prisma.projectUpdate.findUnique({
    where: { id: projectUpdateId },
    select: {
      id: true,
      Project: {
        select: {
          id: true,
          owners: { select: { id: true, username: true } },
          members: { select: { id: true, username: true } },
        },
      },
    },
  });
}

export async function deleteProjectUpdate(projectUpdateId: ProjectUpdate["id"]) {
  return prisma.projectUpdate.delete({ where: { id: projectUpdateId } });
}
