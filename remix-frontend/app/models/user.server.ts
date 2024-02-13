import type { Tag, User } from "@prisma/client";

import { prisma } from "~/db.server";

import type { ProjectList } from "./projects.server";

export async function getUserList(
  properties: { image?: boolean; registrationDate?: boolean } = {}
) {
  return prisma.user.findMany({
    select: {
      id: true,
      username: true,
      image: properties.image ?? false,
      registrationDate: properties.registrationDate ?? false,
    },
  });
}

export type UserOverview = Pick<
  User,
  "id" | "firstName" | "lastName" | "username" | "description" | "image" | "registrationDate"
> & {
  tags: Tag[];
  ownedProjects: ProjectList[];
  memberProjects: ProjectList[];
};
export async function getUserOverview(username: User["id"]): Promise<UserOverview | null> {
  return prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      username: true,
      description: true,
      image: true,
      registrationDate: true,
      tags: true,
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
}

type UserSearchResult = Pick<User, "id" | "username" | "image" | "registrationDate">;
export async function searchUsers(tags?: string[]): Promise<UserSearchResult[]> {
  const select = {
    id: true,
    username: true,
    image: true,
    registrationDate: true,
    _count: { select: { ownedProjects: true, memberProjects: true } },
  };

  if (tags === undefined) {
    return prisma.user.findMany({ select });
  }

  return prisma.user.findMany({
    select,
    where: {
      tags: { some: { OR: tags.map((tag) => ({ name: tag })) } },
    },
  });
}
