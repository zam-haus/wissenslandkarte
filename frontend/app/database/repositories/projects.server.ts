import { Project } from "prisma/generated";
import { SortOrder } from "prisma/generated/internal/prismaNamespace";
import { prisma } from "~/database/db.server";

import { ShallowMetadataValue } from "./projectMetadata.server";

export type ProjectListEntry = Awaited<ReturnType<typeof getProjectList>>[number];

export async function getTotalProjects() {
  return prisma.project.count();
}

export async function getProjectList(options?: {
  limit?: number;
  page?: number;
  byNewestModification?: boolean;
}) {
  return prisma.project.findMany({
    select: {
      id: true,
      title: true,
      latestModificationDate: true,
      mainImage: true,
      tags: true,
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
          mainImage: true,
          tags: true,
        },
      },
      memberProjects: {
        select: {
          id: true,
          title: true,
          latestModificationDate: true,
          mainImage: true,
          tags: true,
        },
      },
    },
  });
  return [...(result?.ownedProjects ?? []), ...(result?.memberProjects ?? [])];
}

export async function getLatestProjectId(username: string): Promise<string | null> {
  const result = await prisma.user.findUnique({
    where: { username },
    select: {
      ownedProjects: {
        select: {
          id: true,
          title: true,
          latestModificationDate: true,
          mainImage: true,
          tags: true,
        },
        take: 1,
        orderBy: {
          latestModificationDate: SortOrder.desc,
        },
      },
      memberProjects: {
        select: {
          id: true,
          title: true,
          latestModificationDate: true,
          mainImage: true,
          tags: true,
        },
        take: 1,
        orderBy: {
          latestModificationDate: SortOrder.desc,
        },
      },
    },
  });
  if (result === null) {
    return null;
  }
  const { ownedProjects, memberProjects } = result;
  if (ownedProjects.length === 0) {
    return memberProjects[0]?.id ?? null;
  }
  if (memberProjects.length === 0) {
    return ownedProjects[0]?.id ?? null;
  }

  if (
    memberProjects[0].latestModificationDate.getTime() <
    ownedProjects[0].latestModificationDate.getTime()
  ) {
    return memberProjects[0]?.id ?? null;
  } else {
    return ownedProjects[0]?.id ?? null;
  }
}

export async function searchProjectsByTags(tags: string[]): Promise<ProjectListEntry[]> {
  return prisma.project.findMany({
    select: {
      id: true,
      title: true,
      latestModificationDate: true,
      mainImage: true,
      tags: true,
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
      finishedAt: true,
      mainImage: true,
      owners: { select: { id: true, username: true } },
      members: { select: { id: true, username: true } },
      tags: true,
      attachments: true,
      metadata: {
        select: {
          id: true,
          value: true,
          metadataType: {
            select: {
              id: true,
              name: true,
              dataType: true,
              translations: {
                select: {
                  language: true,
                  displayName: true,
                  description: true,
                  unit: true,
                },
              },
            },
          },
        },
      },
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
  mainImage?: string;
  owners: string[];
  coworkers: string[];
  tags: string[];
  needProjectSpace: boolean;
  metadata: ShallowMetadataValue[];
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
      mainImage: request.mainImage ?? null,
      creationDate: new Date(),
      latestModificationDate: new Date(),
      ...(request.metadata.length > 0
        ? {
            metadata: {
              create: request.metadata.map((singleDataItem) => ({
                metadataTypeId: singleDataItem.metadataTypeId,
                value: singleDataItem.value,
              })),
            },
          }
        : {}),
    },
  });
}

type ProjectStepRequest = { id: string } & ProjectCreateRequest;
type ProjectStepOptions = { removeImageIfNoNewValueGiven: boolean };
export async function updateProject(request: ProjectStepRequest, options: ProjectStepOptions) {
  function determineMainImage() {
    if (request.mainImage !== undefined) return { mainImage: request.mainImage };
    if (options.removeImageIfNoNewValueGiven) return { mainImage: null };
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
      metadata: {
        deleteMany: {}, // Delete all existing metadata
        create: request.metadata.map((singleDataItem) => ({
          metadataTypeId: singleDataItem.metadataTypeId,
          value: singleDataItem.value,
        })),
      },
      needsProjectArea: request.needProjectSpace,
      creationDate: new Date(),
      latestModificationDate: new Date(),
      ...determineMainImage(),
    },
  });
}

export async function deleteProject(projectId: Project["id"]) {
  return prisma.project.delete({ where: { id: projectId } });
}

export async function updateProjectLatestModificationDate(projectId: Project["id"]) {
  return prisma.project.update({
    where: { id: projectId },
    data: { latestModificationDate: new Date() },
  });
}

export async function finalizeProject(projectId: Project["id"]) {
  const now = new Date();
  if ((await prisma.project.findUnique({ where: { id: projectId } }))?.finishedAt !== null) {
    throw new Error("Project already finished");
  }
  return prisma.project.update({
    where: { id: projectId },
    data: { finishedAt: now, latestModificationDate: now },
  });
}

export async function* getAllProjectsWithCursor(batchSize: number) {
  let cursor: string | undefined;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    const batch = await prisma.project.findMany({
      select: {
        id: true,
        title: true,
        description: true,
      },
      take: batchSize,
      ...(cursor && { cursor: { id: cursor } }),
      orderBy: { id: "asc" },
    });

    if (batch.length === 0) break;

    yield batch;
    cursor = batch[batch.length - 1]?.id;

    if (batch.length < batchSize) break;
  }
}

export async function getFinishedProjects(
  afterEpochInSeconds: Date,
  beforeEpochInSeconds: Date,
  page: number,
) {
  return prisma.project.findMany({
    include: {
      owners: {
        select: {
          id: true,
          username: true,
          image: true,
        },
      },
      members: {
        select: {
          id: true,
          username: true,
          image: true,
        },
      },
      tags: true,
      attachments: true,
      steps: true,
    },
    where: {
      finishedAt: {
        gte: afterEpochInSeconds,
        lte: beforeEpochInSeconds,
      },
    },
    skip: page * 10,
    take: 10,
  });
}
