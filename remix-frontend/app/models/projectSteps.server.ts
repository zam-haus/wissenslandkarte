import type { ProjectStep } from "@prisma/client";
import type { AttachmentType } from "prisma/fake-data-generators";

import { prisma } from "~/db.server";

type ProjectStepCreateRequest = {
  projectId: string;
  description: string;
  photoAttachmentUrls: string[];
};
export async function createProjectStep(request: ProjectStepCreateRequest) {
  return prisma.project.update({
    where: { id: request.projectId },
    data: {
      steps: {
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

export async function getProjectStepWithProjectOwnersAndMembers(projectStepId: ProjectStep["id"]) {
  return prisma.projectStep.findUnique({
    where: { id: projectStepId },
    select: {
      id: true,
      project: {
        select: {
          id: true,
          owners: { select: { id: true, username: true } },
          members: { select: { id: true, username: true } },
        },
      },
    },
  });
}

export async function getEditableProjectStepDetails(projectStepId: ProjectStep["id"]) {
  return prisma.projectStep.findUnique({
    where: { id: projectStepId },
    select: {
      id: true,
      attachments: {
        select: {
          id: true,
          text: true,
          type: true,
          url: true,
        },
      },
      description: true,
      project: {
        select: {
          id: true,
          owners: { select: { id: true, username: true } },
          members: { select: { id: true, username: true } },
        },
      },
    },
  });
}

export async function deleteProjectStep(projectStepId: ProjectStep["id"]) {
  return prisma.projectStep.delete({ where: { id: projectStepId } });
}
