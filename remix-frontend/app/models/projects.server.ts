import type { Attachment, Project, ProjectUpdate, Tag, User } from "@prisma/client";

import { prisma } from "~/db.server";

export type ProjectList = Pick<Project, "id" | "title" | "latestModificationDate" | "mainPhoto">;

export async function getProjectList(options?: {
  limit?: number;
  byNewestModification?: boolean;
}): Promise<ProjectList[]> {
  return prisma.project.findMany({
    select: {
      id: true,
      title: true,
      latestModificationDate: true,
      mainPhoto: true,
    },
    orderBy: options?.byNewestModification ? { latestModificationDate: "desc" } : undefined,
    take: options?.limit,
  });
}

export async function getProjectsByUser(username: string): Promise<ProjectList[]> {
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

export async function searchProjects(tags: string[]): Promise<ProjectList[]> {
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

type UsernameList = Pick<User, "id" | "username">[];
type ProjectDetails = Omit<Project, "needsProjectArea"> & {
  // TODO: Could this be inferred from a built-in prisma type?
  owners: UsernameList;
  members: UsernameList;
  updates: Omit<ProjectUpdate, "id" | "projectId">[];
  tags: Tag[];
  attachments: Attachment[];
};
export async function getProjectDetails(projectId: Project["id"]): Promise<ProjectDetails | null> {
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
      updates: {
        select: {
          description: true,
          creationDate: true,
          attachments: {
            select: {
              type: true,
              url: true,
            },
          },
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

type ProjectUpdateCreateRequest = {
  projectId: string;
  description: string;
};
export async function createProjectUpdate(request: ProjectUpdateCreateRequest) {
  return prisma.project.update({
    where: { id: request.projectId },
    data: {
      updates: {
        create: {
          creationDate: new Date(),
          description: request.description,
        },
      },
    },
  });
}
