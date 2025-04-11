import type { Project } from "@prisma/client";

import { prisma } from "~/db.server";

export type ProjectListEntry = Pick<
  Project,
  "id" | "title" | "latestModificationDate" | "mainPhoto"
>;

export async function getProjectList(options?: {
  limit?: number;
  page?: number;
  byNewestModification?: boolean;
}): Promise<ProjectListEntry[]> {
  return prisma.project.findMany({
    select: {
      id: true,
      title: true,
      latestModificationDate: true,
      mainPhoto: true,
    },
    orderBy: options?.byNewestModification ? { latestModificationDate: "desc" } : undefined,
    take: options?.limit,
    skip: (options?.limit ?? 0) * (options?.page ?? 0),
  });
}

export async function getProjectsByUser(username: string): Promise<ProjectListEntry[]> {
  const result = await prisma.user.findUnique({
    where: { username },
    select: {
      ownedProjects: {
        select: {
          id: true,
          title: true,
          latestModificationDate: true,
          mainPhoto: true,
        },
      },
      memberProjects: {
        select: {
          id: true,
          title: true,
          latestModificationDate: true,
          mainPhoto: true,
        },
      },
    },
  });
  return [...(result?.ownedProjects ?? []), ...(result?.memberProjects ?? [])];
}

export async function searchProjectsByTags(tags: string[]): Promise<ProjectListEntry[]> {
  return prisma.project.findMany({
    select: {
      id: true,
      title: true,
      latestModificationDate: true,
      mainPhoto: true,
    },
    where: {
      tags: { some: { OR: tags.map((tag) => ({ name: tag })) } },
    },
  });
}

export async function getProjectDetails(projectId: Project["id"]) {
  return prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      title: true,
      creationDate: true,
      latestModificationDate: true,
      mainPhoto: true,
      owners: { select: { id: true, username: true } },
      members: { select: { id: true, username: true } },
      tags: true,
      attachments: true,
      steps: {
        select: {
          id: true,
          description: true,
          creationDate: true,
          attachments: true,
        },
      },
      description: true,
    },
  });
}

type ProjectCreateRequest = {
  title: string;
  description: string;
  mainPhoto?: string;
  owners: string[];
  coworkers: string[];
  tags: string[];
  needProjectSpace: boolean;
};
export async function createProject(request: ProjectCreateRequest) {
  return prisma.project.create({
    data: {
      title: request.title,
      description: request.description,
      owners: { connect: request.owners.map((username) => ({ username })) },
      members: { connect: request.coworkers.map((username) => ({ username })) },
      tags: {
        connectOrCreate: request.tags.map((name) => ({ create: { name }, where: { name } })),
      },
      needsProjectArea: request.needProjectSpace,
      mainPhoto: request.mainPhoto ?? null,
      creationDate: new Date(),
      latestModificationDate: new Date(),
    },
  });
}

type ProjectStepRequest = { id: string } & ProjectCreateRequest;
type ProjectStepOptions = { removePhotoIfNoNewValueGiven: boolean };
export async function updateProject(request: ProjectStepRequest, options: ProjectStepOptions) {
  function determineMainPhoto() {
    if (request.mainPhoto !== undefined) return { mainPhoto: request.mainPhoto };
    if (options.removePhotoIfNoNewValueGiven) return { mainPhoto: null };
    return {};
  }
  return prisma.project.update({
    where: { id: request.id },
    data: {
      title: request.title,
      description: request.description,
      owners: {
        set: [], // deletes all connections, then "reconnects" the updated list
        connect: request.owners.map((username) => ({ username })),
      },
      members: {
        set: [],
        connect: request.coworkers.map((username) => ({ username })),
      },
      tags: {
        set: [],
        connectOrCreate: request.tags.map((name) => ({ create: { name }, where: { name } })),
      },
      needsProjectArea: request.needProjectSpace,
      creationDate: new Date(),
      latestModificationDate: new Date(),
      ...determineMainPhoto(),
    },
  });
}
