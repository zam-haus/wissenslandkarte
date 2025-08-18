import { ProjectStep } from "prisma/generated";
import type { AttachmentType } from "prisma/initialization/data/fake-data-generators";
import { prisma } from "~/database/db.server";

type ProjectStepCreateRequest = {
  projectId: string;
  description: string;
  imageAttachmentUrls: string[];
};
export async function createProjectStep(request: ProjectStepCreateRequest) {
  return prisma.projectStep.create({
    data: {
      projectId: request.projectId,
      creationDate: new Date(),
      latestModificationDate: new Date(),
      description: request.description,
      attachments: {
        create: request.imageAttachmentUrls.map((url) => ({
          type: "image" as AttachmentType,
          url,
          text: "",
          creationDate: new Date(),
        })),
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
      attachments: {
        select: {
          id: true,
          url: true,
          type: true,
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

type ProjectStepUpdateRequest = ProjectStepCreateRequest & {
  attachmentsToRemove: string[];
};
export async function updateProjectStep(
  projectStepId: ProjectStep["id"],
  request: ProjectStepUpdateRequest,
) {
  return prisma.projectStep.update({
    where: { id: projectStepId },
    data: {
      description: request.description,
      projectId: request.projectId,
      attachments: {
        create: request.imageAttachmentUrls.map((url) => ({
          type: "image" satisfies AttachmentType,
          url,
          text: "",
          creationDate: new Date(),
        })),
        deleteMany: request.attachmentsToRemove.map((id) => ({ id })),
      },
    },
  });
}
