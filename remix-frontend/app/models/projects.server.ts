import type { Attachment, Project, ProjectUpdate, Tag, User } from "@prisma/client";

import { prisma } from '~/db.server';

export type ProjectList = Pick<Project, "id" | "title" | "latestModificationDate" | "mainPhoto">

export async function getProjectList(options?: { limit?: number, byNewestModification?: boolean }): Promise<ProjectList[]> {
  return prisma.project.findMany({
    select: {
      id: true,
      title: true,
      latestModificationDate: true,
      mainPhoto: true
    },
    orderBy: options?.byNewestModification ? { latestModificationDate: "desc" } : undefined,
    take: options?.limit
  })
}

type UsernameList = Pick<User, 'username'>[]
type ProjectDetails = Omit<Project, 'needsProjectArea'> & // TODO: Could this be inferred from a built-in prisma type?
{
  owners: UsernameList,
  members: UsernameList,
  updates: Omit<ProjectUpdate, 'id' | 'projectId'>[],
  tags: Tag[],
  attachments: Attachment[]
}
export async function getProjectDetails(projectId: Project['id']): Promise<ProjectDetails | null> {
  return prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      title: true,
      creationDate: true,
      latestModificationDate: true,
      mainPhoto: true,
      owners: { select: { username: true } },
      members: { select: { username: true } },
      tags: true,
      attachments: true,
      updates: {
        select: {
          description: true,
          creationDate: true,
          attachments: {
            select: {
              type: true,
              url: true
            }
          }
        }
      },
      description: true
    }
  })
}
