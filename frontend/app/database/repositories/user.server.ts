import type { Tag, User } from "prisma/generated";
import { prisma } from "~/database/db.server";
import { UserWithRoles } from "~/lib/authorization.server";

import type { ProjectListEntry } from "./projects.server";

export type UserListEntry = Pick<User, "id" | "username"> &
  Partial<Pick<User, "image" | "registrationDate">>;

export async function getUserList(
  properties: { image?: boolean; registrationDate?: boolean } = {},
  options?: {
    limit?: number;
    page?: number;
  },
): Promise<UserListEntry[]> {
  return prisma.user.findMany({
    select: {
      id: true,
      username: true,
      image: properties.image ?? false,
      registrationDate: properties.registrationDate ?? false,
    },
    take: options?.limit,
    skip: (options?.limit ?? 0) * (options?.page ?? 0),
  });
}

export async function getUserListFiltered(filter: string) {
  return prisma.user.findMany({
    select: {
      id: true,
      username: true,
    },
    where: { username: { contains: filter } },
    take: 50,
  });
}

export type UserOverview = Pick<
  User,
  "id" | "firstName" | "lastName" | "username" | "description" | "image" | "registrationDate"
> & {
  tags: Tag[];
  ownedProjects: ProjectListEntry[];
  memberProjects: ProjectListEntry[];
};
export async function getUserOverview(username: User["username"]): Promise<UserOverview | null> {
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

type UpdateUserRequest = Pick<User, "id" | "username" | "description" | "image">;
export async function updateUser(updateRequest: UpdateUserRequest): Promise<UserWithRoles> {
  const { id, ...data } = updateRequest;
  return prisma.user.update({
    where: { id },
    data,
    include: { roles: { select: { title: true } } },
  });
}

export type ContactData = Pick<User, "id" | "username" | "contactEmailAddress" | "image">;
export async function getUserContactData(username: User["username"]): Promise<ContactData | null> {
  return prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      contactEmailAddress: true,
      image: true,
    },
  });
}
