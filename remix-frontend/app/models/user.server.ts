import { Project, Tag, User } from "@prisma/client";
import { prisma } from "~/db.server";

export async function getUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      username: true
    }
  });
};

type UserOverviewProject = Pick<Project, "id" | "title" | "latestModificationDate" | "mainPhoto">
type UserOverview =
  Pick<User, "firstName" | "lastName" | "username" | "description" | "image" | "registrationDate"> &
  {
    tags: Tag[],
    ownedProjects: UserOverviewProject[]
    memberProjects: UserOverviewProject[]

  }
export async function getUserOverview(username: string): Promise<UserOverview | null> {
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
      ownedProjects: { select: { id: true, title: true, latestModificationDate: true, mainPhoto: true } },
      memberProjects: { select: { id: true, title: true, latestModificationDate: true, mainPhoto: true } }
    }
  })
}
